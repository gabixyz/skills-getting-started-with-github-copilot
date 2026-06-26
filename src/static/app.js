document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and any previous options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const maxParticipants = details.max_participants;
        const spotsLeft = maxParticipants - details.participants.length;
        const participants = details.participants || [];
        const participantItems = participants.length
          ? participants
              .map(
                (participant) => `
                  <div class="participant-chip" data-email="${participant}">
                    <span class="participant-name">${participant}</span>
                    <button class="participant-remove" type="button" aria-label="Remove ${participant}" title="Remove participant">×</button>
                  </div>
                `
              )
              .join("")
          : '<div class="participant-chip empty">No participants yet</div>';

        activityCard.innerHTML = `
          <div class="card-accent"></div>
          <div class="card-content">
            <div class="card-top">
              <div>
                <h4>${name}</h4>
                <p class="card-description">${details.description}</p>
              </div>
              <span class="availability-pill">${spotsLeft} spots left</span>
            </div>

            <div class="card-meta">
              <div class="meta-item">
                <span>🗓️</span>
                <p><strong>Schedule:</strong> ${details.schedule}</p>
              </div>
            </div>

            <div class="participants-section">
              <div class="participants-heading">Participants</div>
              <div class="participants-list">${participantItems}</div>
            </div>
          </div>
        `;

        activityCard.addEventListener("click", async (event) => {
          const removeButton = event.target.closest(".participant-remove");
          if (!removeButton) return;

          const chip = removeButton.closest(".participant-chip");
          if (!chip || chip.classList.contains("empty")) return;

          const email = chip.dataset.email;
          if (!email) return;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.detail || "Unable to remove participant");
            }

            chip.remove();

            const remainingChips = activityCard.querySelectorAll(".participant-chip:not(.empty)");
            const availabilityBadge = activityCard.querySelector(".availability-pill");
            const spotsRemaining = maxParticipants - remainingChips.length;

            if (availabilityBadge) {
              availabilityBadge.textContent = `${spotsRemaining} spots left`;
            }

            const participantsList = activityCard.querySelector(".participants-list");
            if (participantsList && remainingChips.length === 0) {
              participantsList.innerHTML = '<div class="participant-chip empty">No participants yet</div>';
            }
          } catch (error) {
            console.error("Error removing participant:", error);
          }
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
