# Libre WebUI Homebrew Formula
# Privacy-first AI chat interface - Self-hosted, open source, extensible
#
# Installation:
#   brew tap libre-webui/tap
#   brew install libre-webui
#
# Or install directly:
#   brew install libre-webui/tap/libre-webui

class LibreWebui < Formula
  desc "Privacy-first AI chat interface - Self-hosted, open source, extensible"
  homepage "https://librewebui.org"
  url "https://github.com/libre-webui/libre-webui/archive/refs/tags/v0.3.2.tar.gz"
  sha256 "1489d4f0abc10669f4354178b92da6ba9bdc9fcb3e19ae40c4201308a014fd24"
  license "Apache-2.0"
  head "https://github.com/libre-webui/libre-webui.git", branch: "main"

  depends_on "node@20"

  def install
    system "npm", "install", "--ignore-scripts", "--legacy-peer-deps"
    system "npm", "run", "build"

    # Install the package to libexec
    libexec.install Dir["*"]
    libexec.install ".env.example" if File.exist?(".env.example")

    # Create wrapper script
    (bin/"libre-webui").write <<~EOS
      #!/bin/bash
      export PATH="#{Formula["node@20"].opt_bin}:$PATH"
      exec "#{libexec}/bin/cli.js" "$@"
    EOS
  end

  def post_install
    # Create data directory
    (var/"libre-webui").mkpath
  end

  def caveats
    <<~EOS
      Libre WebUI has been installed!

      To start the server:
        libre-webui

      To start on a custom port:
        libre-webui --port 3000

      Configuration:
        Data is stored in: #{var}/libre-webui
        Or set DATA_DIR environment variable

      Optional: Connect to Ollama for local LLM support:
        brew install ollama
        ollama serve

      For API providers, set environment variables:
        export OLLAMA_BASE_URL=http://localhost:11434
        export OPENAI_API_KEY=your-key
        export ANTHROPIC_API_KEY=your-key

      Documentation: https://docs.librewebui.org
    EOS
  end

  service do
    run [opt_bin/"libre-webui"]
    keep_alive true
    working_dir var/"libre-webui"
    log_path var/"log/libre-webui.log"
    error_log_path var/"log/libre-webui.log"
    environment_variables PATH: std_service_path_env
  end

  test do
    assert_match "libre-webui", shell_output("#{bin}/libre-webui --version")
  end
end
