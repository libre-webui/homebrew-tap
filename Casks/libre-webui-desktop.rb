# Libre WebUI Cask Formula
# Generated from the release template in the main repo.
#
# Installation:
#   brew tap libre-webui/tap
#   brew install --cask libre-webui-desktop
#
# Or install directly:
#   brew install --cask libre-webui/tap/libre-webui-desktop

cask "libre-webui-desktop" do
  version "0.28.0"
  sha256 "795d1ce2e380adafeb010d1c7283bf4292757d20e96cae419dc38ccdd0580be0"

  # Releases up to 0.26.0 predate the rename to "Libre WebUI Desktop" and
  # ship assets under the old "Frontend" name; the hourly updater rewrites
  # the download and app stanzas to match whatever the release contains.
  url "https://github.com/libre-webui/libre-webui/releases/download/v#{version}/Libre-WebUI-Desktop-#{version}-mac-arm64.dmg",
      verified: "github.com/libre-webui/libre-webui/"
  name "Libre WebUI Desktop"
  desc "Open, self-hosted workspace for creating with AI"
  homepage "https://librewebui.org/"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on arch: :arm64
  depends_on macos: :monterey

  app "Libre WebUI Desktop.app"

  zap trash: [
    "~/.libre-webui",
    "~/Library/Application Support/Libre WebUI Desktop",
    "~/Library/Application Support/Libre WebUI Frontend",
    "~/Library/Application Support/libre-webui",
    "~/Library/Caches/com.librewebui.app",
    "~/Library/Caches/libre-webui",
    "~/Library/Preferences/com.librewebui.app.plist",
    "~/Library/Saved Application State/com.librewebui.app.savedState",
  ]

  caveats <<~EOS
    Libre WebUI Desktop connects to a Libre WebUI backend on port 3001.
    Install and start the backend with:
      brew install --formula libre-webui
      libre-webui --port 3001

    Documentation: https://docs.librewebui.org
  EOS
end
