document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    const response = await fetch("/activities");
    if (!response.ok) {
      throw new Error(`Failed to load activities: ${response.status}`);
    }
    const activities = await response.json();

    activitiesList.innerHTML = "";
    activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const heading = document.createElement("h4");
      heading.textContent = name;
      activityCard.appendChild(heading);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule:";
      schedule.append(scheduleLabel, ` ${details.schedule}`);
      activityCard.appendChild(schedule);

      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability:";
      availability.append(availabilityLabel, ` ${spotsLeft} spots left`);
      activityCard.appendChild(availability);

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      activityCard.appendChild(participantsHeading);

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";
      participantsList.setAttribute("aria-label", `Participants in ${name}`);

      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No participants yet.";
        emptyMessage.className = "no-participants";
        participantsList.appendChild(emptyMessage);
      } else {
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const unregisterButton = document.createElement("button");
          unregisterButton.type = "button";
          unregisterButton.className = "unregister-button";
          unregisterButton.textContent = "Remove";
          unregisterButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          unregisterButton.addEventListener("click", () => unregisterParticipant(name, email, unregisterButton));
          participant.appendChild(unregisterButton);

          participantsList.appendChild(participant);
        });
      }

      activityCard.appendChild(participantsList);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  function showActivitiesLoadError(error) {
    activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
    console.error("Error fetching activities:", error);
  }

  async function unregisterParticipant(activity, email, button) {
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      try {
        await fetchActivities();
        showMessage(result.message, "success");
      } catch (error) {
        showActivitiesLoadError(error);
        showMessage("Unregistered successfully, but the activity list could not be refreshed.", "error");
      }
    } catch (error) {
      showMessage(error.message || "Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
      button.disabled = false;
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
        signupForm.reset();
        try {
          await fetchActivities();
          showMessage(result.message, "success");
        } catch (error) {
          showActivitiesLoadError(error);
          showMessage("Signed up successfully, but the activity list could not be refreshed.", "error");
        }
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities().catch(showActivitiesLoadError);
});
