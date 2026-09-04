// Interactive AI Decision Copilot Controller for FRA Monitoring

export class AICopilotController {
  constructor(aiService, getContextCallback) {
    this.aiService = aiService;
    this.getContext = getContextCallback;
    this.isProcessing = false;
  }

  init() {
    const input = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("btn-send-ai-message");
    const presetChips = document.querySelectorAll(".ai-preset-chip");

    if (sendBtn && input) {
      sendBtn.onclick = () => this.handleSendMessage();
      input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      };
    }

    presetChips.forEach((chip) => {
      chip.onclick = () => {
        const prompt = chip.getAttribute("data-prompt");
        if (input) input.value = prompt;
        this.handleSendMessage();
      };
    });
  }

  updateContextDisplay(context) {
    const ctxDistrict = document.getElementById("ai-ctx-district");
    const ctxAnomalies = document.getElementById("ai-ctx-anomalies");

    if (ctxDistrict) {
      ctxDistrict.innerText =
        context.currentDistrict === "ALL"
          ? `All Districts (${context.currentState})`
          : `${context.currentDistrict} (${context.currentState})`;
    }

    if (ctxAnomalies) {
      const anomalyCount = context.claims.filter((c) => c.hasAnomaly).length;
      ctxAnomalies.innerText = `${anomalyCount} flagged`;
    }
  }

  async handleSendMessage() {
    const input = document.getElementById("ai-chat-input");
    if (!input || this.isProcessing) return;

    const messageText = input.value.trim();
    if (!messageText) return;

    input.value = "";
    this.isProcessing = true;

    // Append User Message to UI
    this.appendMessage("user", messageText);

    // Append Loading Indicator
    const loadingId = this.appendLoadingMessage();

    try {
      const activeContext = this.getContext();
      const responseHtml = await this.aiService.processCopilotQuery(
        messageText,
        activeContext
      );

      this.removeLoadingMessage(loadingId);
      this.appendMessage("bot", responseHtml, true);
    } catch (err) {
      this.removeLoadingMessage(loadingId);
      this.appendMessage(
        "bot",
        `<p style="color: var(--rose-danger);">Error generating AI response. Please retry.</p>`,
        true
      );
    } finally {
      this.isProcessing = false;
    }
  }

  appendMessage(sender, text, isHtml = false) {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}-message`;

    const avatarIcon =
      sender === "user" ? "fa-user-tie" : "fa-brain";

    const contentHtml = isHtml ? text : `<p>${text}</p>`;

    msgDiv.innerHTML = `
      <div class="msg-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
      <div class="msg-bubble">${contentHtml}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  appendLoadingMessage() {
    const container = document.getElementById("chat-messages-container");
    if (!container) return "";

    const loadingId = `msg-loading-${Date.now()}`;
    const msgDiv = document.createElement("div");
    msgDiv.id = loadingId;
    msgDiv.className = "chat-message bot-message";
    msgDiv.innerHTML = `
      <div class="msg-avatar"><i class="fa-solid fa-brain"></i></div>
      <div class="msg-bubble" style="color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> Consulting Forest Rights Act statutory provisions & analyzing live spatial data...
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return loadingId;
  }

  removeLoadingMessage(loadingId) {
    const el = document.getElementById(loadingId);
    if (el) el.remove();
  }
}
