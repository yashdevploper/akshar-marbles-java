(function () {
  const watchButton = document.getElementById("watch-story-button");
  const modal = document.getElementById("story-modal");
  const video = modal?.querySelector(".story-modal-video");
  const closeButton = modal?.querySelector(".story-modal-close");

  if (!watchButton || !modal || !video || !closeButton) {
    return;
  }

  let closing = false;

  function closeStory() {
    if (!modal.classList.contains("is-open") || closing) {
      return;
    }

    closing = true;
    modal.classList.add("is-closing");
    video.pause();

    const finishClosing = (event) => {
      if (event.target !== modal) {
        return;
      }
      modal.classList.remove("is-open", "is-closing");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("story-modal-open");
      closing = false;
      modal.removeEventListener("animationend", finishClosing);
    };

    modal.addEventListener("animationend", finishClosing);
  }

  function openStory(event) {
    event.preventDefault();
    closing = false;
    modal.classList.remove("is-closing");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("story-modal-open");
    closeButton.focus();

    video.currentTime = 0;
    const playback = video.play();
    if (playback) {
      playback.catch(() => {
        video.focus();
      });
    }
  }

  watchButton.addEventListener("click", openStory);
  closeButton.addEventListener("click", closeStory);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeStory();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeStory();
    }
  });
})();
