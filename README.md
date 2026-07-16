# Libre WebUI for Homebrew

Official Homebrew formula and cask for [Libre WebUI](https://librewebui.org).

## Install the command-line application

```bash
brew tap libre-webui/tap
brew install libre-webui
```

Start Libre WebUI:

```bash
libre-webui
```

## Install the macOS desktop frontend

The desktop application currently supports Apple silicon Macs.

```bash
brew tap libre-webui/tap
brew install --cask libre-webui
```

The desktop frontend connects to a Libre WebUI backend on port `3001`. Start
one with:

```bash
libre-webui --port 3001
```

## Update

```bash
brew update
brew upgrade libre-webui
brew upgrade --cask libre-webui
```

[Website](https://librewebui.org) · [Documentation](https://docs.librewebui.org) · [Source](https://github.com/libre-webui/libre-webui)

## Release updates

The tap checks the latest stable npm release every hour. When a new GitHub
release contains the matching macOS artifact, it recalculates both checksums,
runs strict Homebrew validation, and updates the formula and cask together.
