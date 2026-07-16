# Libre WebUI Cask Formula
# Generated from the release template in the main repo.
#
# Installation:
#   brew tap libre-webui/tap
#   brew install --cask libre-webui-frontend
#
# Or install directly:
#   brew install --cask libre-webui/tap/libre-webui-frontend

cask "libre-webui-frontend" do
  version "0.14.1"
  sha256 "c1b63d821b605cbddb65a97ff78e30d54c33ff87c7008c4d0af518ffdbec3252"

  url "https://github.com/libre-webui/libre-webui/releases/download/v#{version}/Libre-WebUI-Frontend-#{version}-mac-arm64.dmg",
      verified: "github.com/libre-webui/libre-webui/"
  name "Libre WebUI Frontend"
  desc "Open, self-hosted workspace for creating with AI"
  homepage "https://librewebui.org/"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on arch: :arm64
  depends_on macos: :monterey

  app "Libre WebUI Frontend.app"

  zap trash: [
    "~/.libre-webui",
    "~/Library/Application Support/Libre WebUI Frontend",
    "~/Library/Application Support/libre-webui",
    "~/Library/Caches/com.librewebui.app",
    "~/Library/Caches/libre-webui",
    "~/Library/Preferences/com.librewebui.app.plist",
    "~/Library/Saved Application State/com.librewebui.app.savedState",
  ]

  caveats <<~EOS
    Libre WebUI Frontend connects to a Libre WebUI backend on port 3001.
    Install and start the backend with:
      brew install libre-webui
      libre-webui --port 3001

    Documentation: https://docs.librewebui.org
  EOS
end
