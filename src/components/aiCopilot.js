// Interactive AI Decision Copilot Controller for FRA Monitoring (VanDrishti AI Agent)

export class AICopilotController {
  constructor(aiService, getContextCallback) {
    this.aiService = aiService;
    this.getContext = getContextCallback;
    this.isProcessing = false;
    this.isDrawerOpen = false;
  }

  init() {
    // 1. Bind Main View Copilot Inputs
    const mainInput = document.getElementById("ai-chat-input");
    const mainSendBtn = document.getElementById("btn-send-ai-message");
    const mainPresetChips = document.querySelectorAll(".ai-preset-chip");

    if (mainSendBtn && mainInput) {
      mainSendBtn.onclick = () => this.handleSendMessage(mainInput, "chat-messages-container");
      mainInput.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage(mainInput, "chat-messages-container");
        }
      };
    }

    mainPresetChips.forEach((chip) => {
      chip.onclick = () => {
        const prompt = chip.getAttribute("data-prompt");
        if (mainInput) mainInput.value = prompt;
        this.handleSendMessage(mainInput, "chat-messages-container");
      };
    });

    // 2. Bind Persistent Side Agent Drawer
    const drawerToggleBtn = document.getElementById("btn-toggle-sidebar-agent");
    const drawerCloseBtn = document.getElementById("btn-close-sidebar-agent");
    const drawer = document.getElementById("sidebar-ai-agent-drawer");
    const drawerInput = document.getElementById("agent-drawer-input");
    const drawerSendBtn = document.getElementById("btn-send-drawer-message");
    const drawerChips = document.querySelectorAll(".agent-quick-chip");
    const floatingAssistantBubble = document.getElementById("btn-floating-ai-assistant");

    if (drawerToggleBtn) {
      drawerToggleBtn.onclick = () => this.toggleDrawer();
    }

    if (drawerCloseBtn) {
      drawerCloseBtn.onclick = () => this.closeDrawer();
    }

    if (floatingAssistantBubble) {
      floatingAssistantBubble.onclick = () => this.openDrawer();
    }

    if (drawerSendBtn && drawerInput) {
      drawerSendBtn.onclick = () => this.handleSendMessage(drawerInput, "agent-drawer-messages-container");
      drawerInput.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage(drawerInput, "agent-drawer-messages-container");
        }
      };
    }

    drawerChips.forEach((chip) => {
      chip.onclick = () => {
        const prompt = chip.getAttribute("data-agent-prompt");
        if (drawerInput) drawerInput.value = prompt;
        this.handleSendMessage(drawerInput, "agent-drawer-messages-container");
      };
    });
  }

  toggleDrawer() {
    const drawer = document.getElementById("sidebar-ai-agent-drawer");
    if (!drawer) return;
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      drawer.classList.add("open");
      const drawerInput = document.getElementById("agent-drawer-input");
      if (drawerInput) setTimeout(() => drawerInput.focus(), 200);
    } else {
      drawer.classList.remove("open");
    }
  }

  openDrawer() {
    const drawer = document.getElementById("sidebar-ai-agent-drawer");
    if (!drawer) return;
    this.isDrawerOpen = true;
    drawer.classList.add("open");
    const drawerInput = document.getElementById("agent-drawer-input");
    if (drawerInput) setTimeout(() => drawerInput.focus(), 200);
  }

  closeDrawer() {
    const drawer = document.getElementById("sidebar-ai-agent-drawer");
    if (!drawer) return;
    this.isDrawerOpen = false;
    drawer.classList.remove("open");
  }

  updateContextDisplay(context) {
    const ctxDistrict = document.getElementById("ai-ctx-district");
    const ctxAnomalies = document.getElementById("ai-ctx-anomalies");
    const drawerCtxDistrict = document.getElementById("agent-drawer-ctx-district");
    const drawerCtxAnomalies = document.getElementById("agent-drawer-ctx-anomalies");

    const districtLabel =
      context.currentDistrict === "ALL"
        ? `All Districts (${context.currentState})`
        : `${context.currentDistrict} (${context.currentState})`;

    const anomalyCount = context.claims.filter((c) => c.hasAnomaly).length;

    if (ctxDistrict) ctxDistrict.innerText = districtLabel;
    if (ctxAnomalies) ctxAnomalies.innerText = `${anomalyCount} flagged`;
    if (drawerCtxDistrict) drawerCtxDistrict.innerText = districtLabel;
    if (drawerCtxAnomalies) drawerCtxAnomalies.innerText = `${anomalyCount} flagged`;
  }

  async handleSendMessage(inputEl, containerId) {
    if (!inputEl || this.isProcessing) return;

    const messageText = inputEl.value.trim();
    if (!messageText) return;

    inputEl.value = "";
    this.isProcessing = true;

    // Append User Message to UI
    this.appendMessage("user", messageText, false, containerId);

    // Append Loading Indicator
    const loadingId = this.appendLoadingMessage(containerId);

    try {
      const activeContext = this.getContext();
      const responseHtml = await this.aiService.processCopilotQuery(
        messageText,
        activeContext
      );

      this.removeLoadingMessage(loadingId);
      this.appendMessage("bot", responseHtml, true, containerId);
    } catch (err) {
      this.removeLoadingMessage(loadingId);
      this.appendMessage(
        "bot",
        `<p style="color: var(--rose-danger);">Error generating AI response. Please verify API connection or retry.</p>`,
        true,
        containerId
      );
    } finally {
      this.isProcessing = false;
    }
  }

  appendMessage(sender, text, isHtml = false, containerId = "chat-messages-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}-message`;

    let avatarHtml = `<div class="msg-avatar"><i class="fa-solid fa-user-tie"></i></div>`;
    if (sender !== "user") {
      avatarHtml = `<div class="msg-avatar"><img src="/vandrishti-logo.png" alt="AI" class="agent-msg-avatar" /></div>`;
    }

    const contentHtml = isHtml ? text : `<p>${text}</p>`;

    msgDiv.innerHTML = `
      ${avatarHtml}
      <div class="msg-bubble">${contentHtml}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  appendLoadingMessage(containerId = "chat-messages-container") {
    const container = document.getElementById(containerId);
    if (!container) return "";

    const loadingId = `msg-loading-${Date.now()}`;
    const msgDiv = document.createElement("div");
    msgDiv.id = loadingId;
    msgDiv.className = "chat-message bot-message";
    msgDiv.innerHTML = `
      <div class="msg-avatar"><img src="/vandrishti-logo.png" alt="AI" class="agent-msg-avatar" /></div>
      <div class="msg-bubble" style="color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> VanDrishti AI is checking statutory provisions & geospatial layers...
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
