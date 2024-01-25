# This Makefile has been written according to guidelines at
# https://tech.davis-hansson.com/p/make/

# Use ">" instead of "\t" for blocks to avoid surprising whitespace issues
ifeq ($(origin .RECIPEPREFIX), undefined)
  $(error "This Make does not support .RECIPEPREFIX. Please use GNU Make 4.0 or later. If you've installed an up-to-date Make with homebrew, you maye need to invoke 'gmake' instead of 'make'.")
endif
.RECIPEPREFIX = >

# Make sure we use actual bash instead of zsh or sh
SHELL := bash

# Enforce bash "strict mode"
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
.SHELLFLAGS := -euo pipefail -c

# Use one shell session per rule instead of one shell session per line
.ONESHELL:

# Indicate this Makefile is portable
.POSIX:

# Delete the target of a Make rule if the rule fails
.DELETE_ON_ERROR:

# Warn on undefined variables
MAKEFLAGS += --warn-undefined-variables

# Disable all the magical-but-unreadable bits of Make
MAKEFLAGS += --no-builtin-rules

# Wrap npx so it only uses local dependencies
NPX := npx --no-install

###############################################################################
## Constants
###############################################################################

VERSION           ?= $(shell jq -r .version package.json)
BUILDKITE_VERSION := $(shell VERSION=$(VERSION) scripts/get-buildkite-version)
ACTION_VERSION    := $(shell VERSION=$(VERSION) scripts/get-action-version)

###############################################################################
## Files
###############################################################################

SRC_FILES           := $(shell find src -name '*.ts')
DIST_CJS_FILES      := $(subst .ts,.js, $(subst src,dist/cjs,$(SRC_FILES)))
DIST_ESM_FILES      := $(subst .ts,.js, $(subst src,dist/esm,$(SRC_FILES)))
DIST_TYPES_FILES    := $(subst .ts,.d.ts, $(subst src,dist/types,$(SRC_FILES)))

EXES                := dist/pkg/crr-$(VERSION)-linux dist/pkg/crr-$(VERSION)-macos dist/pkg/crr-$(VERSION)-windows.exe dist/ncc/index.js
EXE_SHAS            := $(addsuffix .sha1, $(EXES))

ACTION_SRC_FILES    := $(shell find integrations/action/src -name '*.ts')
ACTION_BUILD_FILES   := $(subst .ts,.js, $(subst src,build,$(ACTION_SRC_FILES)))
ACTION_SHORT        := dist/index.js README.md
ACTION_ALL          := $(addprefix integrations/action/, $(ACTION_SHORT)) $(ACTION_BUILD_FILES)

BUILDKITE_ALL_SHORT := bin/crr-linux bin/crr-macos bin/crr-windows.exe README.md
BUILDKITE_ALL       := $(addprefix integrations/check-run-reporter-buildkite-plugin/, $(BUILDKITE_ALL_SHORT))

###############################################################################
## Default Target
###############################################################################

all: $(EXES) $(EXE_SHAS) $(DIST_CJS_FILES) $(DIST_ESM_FILES) $(DIST_TYPES_FILES) README.md $(ACTION_ALL) $(BUILDKITE_ALL)

clean:
> $(NPX) rimraf dist integrations/*/dist integrations/check-run-reporter-buildkite-plugin/bin
> sed -i.bak -e "s#$(BUILDKITE_VERSION)#0.0.0#g" integrations/check-run-reporter-buildkite-plugin/README.md
> $(NPX) rimraf integrations/check-run-reporter-buildkite-plugin/README.md.bak
> sed -i.bak -e "s#$(ACTION_VERSION)#0.0.0#g" integrations/action/README.md
> $(NPX) rimraf integrations/action/README.md.bak
> $(NPX) rimraf .action_version .buildkite_version
.PHONY: clean

###############################################################################
## Helpers
###############################################################################

# Print any Makefile variable
# Usage: make print-USER
print-%  : ; @echo $* = $($*)
.PHONY: print-%

###############################################################################
## Rules
###############################################################################

$(DIST_CJS_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/cjs
> BUILD_TARGET=cjs $(NPX) babel --source-maps --extensions '.js,.ts,.tsx' -d dist/cjs src

$(DIST_ESM_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/esm
> BUILD_TARGET=esm $(NPX) babel --source-maps --extensions '.js,.ts,.tsx' -d dist/esm src

$(DIST_TYPES_FILES) &: $(SRC_FILES)
> $(NPX) rimraf dist/types
> $(NPX) tsc --emitDeclarationOnly
> $(NPX) rimraf dist/types/integrations

%.sha1: %
> sha1sum $< > $@

###############################################################################
## Targets
###############################################################################

dist/ncc/index.js: $(SRC_FILES)
> $(NPX) ncc build ./src/cli.ts --source-map --out dist/ncc

# Vercel has abandoned pkg, so we're stuck with bundling node18 likely until
# node22 goes lts with native support for single executable applications
dist/pkg/crr-$(VERSION)-linux: dist/ncc/index.js
> $(NPX) pkg . --target node18-linux --output $@

# Vercel has abandoned pkg, so we're stuck with bundling node18 likely until
# node22 goes lts with native support for single executable applications
dist/pkg/crr-$(VERSION)-macos: dist/ncc/index.js
> $(NPX) pkg . --target node18-macos --output $@

# Vercel has abandoned pkg, so we're stuck with bundling node18 likely until
# node22 goes lts with native support for single executable applications
dist/pkg/crr-$(VERSION)-windows.exe: dist/ncc/index.js
> $(NPX) pkg . --target node18-windows --output $@

README.md:
> $(NPX) markdown-toc -i --bullets='-' --maxdepth=3 README.md
> $(NPX) prettier --write README.md
.PHONY: README.md

.buildkite_version:
> echo $(BUILDKITE_VERSION) > .buildkite_version

integrations/check-run-reporter-buildkite-plugin/bin/crr-%: dist/pkg/crr-$(VERSION)-%
> mkdir -p $(@D)
> cp $< $@

integrations/check-run-reporter-buildkite-plugin/README.md: .buildkite_version
> sed -i.bak -e "s#0.0.0#$(BUILDKITE_VERSION)#g" $@
> rm $@.bak


###############################################################################
## Action Rules
###############################################################################

$(ACTION_BUILD_FILES) &: $(ACTION_SRC_FILES)
> $(NPX) rimraf integrations/actions/build
> $(NPX) -w integrations/action babel --source-maps --extensions '.js,.ts' -d build src

###############################################################################
## Action Targets
###############################################################################

# for reasons I can't entirely explain, the `require.main === module` check
# doesn't work if ncc is allowed to do the compilation.
integrations/action/dist/index.js: $(ACTION_BUILD_FILES) $(DIST_CJS_FILES)
> $(NPX) -w integrations/action ncc build build/index.js --source-map

.action_version:
> echo $(ACTION_VERSION) > .action_version

integrations/action/README.md: .action_version
> sed -i.bak -e "s#0.0.0#$(ACTION_VERSION)#g" $@
> rm $@.bak
