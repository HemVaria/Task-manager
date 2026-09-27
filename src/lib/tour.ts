"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "taskmanager:tour:v1";

export const isTourActive = () => document.body.classList.contains("driver-active");

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "done";
  } catch {
    return true;
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_KEY, "done");
  } catch {
    // Not fatal; the tour may show again next visit.
  }
}

/** An element counts as visible if it has a box on screen (the sidebar is off-canvas on mobile). */
function isVisible(selector: string): boolean {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
}

const STEPS: DriveStep[] = [
  {
    popover: {
      title: "Welcome to Tasks 👋",
      description: "A quick tour of the four moves you'll use every day. It takes about 20 seconds.",
      showButtons: ["next", "close"],
    },
  },
  {
    element: "[data-tour='quick-add']",
    popover: {
      title: "Capture in seconds",
      description: "Type a task and press <kbd>Enter</kbd>. Set priority, date and project right here, or later. Press <kbd>N</kbd> from anywhere to jump back.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='task-check']",
    popover: {
      title: "Tick it off",
      description: "Click the circle to complete a task without opening it. Click the title to see and edit every detail.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='projects']",
    popover: {
      title: "Organize by project",
      description: "Group work into projects. Use <strong>+</strong> to add one, or the ⋯ menu to rename or delete it.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='dashboard']",
    popover: {
      title: "Your day at a glance",
      description: "Live counts of what's due, in progress and overdue. Click a card to filter the list.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='layout']",
    popover: {
      title: "List or board",
      description: "Switch to a board and drag tasks between columns to change their status. Press <kbd>B</kbd> to flip between them.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='theme']",
    popover: {
      title: "You're all set",
      description: "Switch between light and dark here. Press <kbd>?</kbd> any time to see keyboard shortcuts.",
      side: "bottom",
      align: "end",
    },
  },
];

export function startTour() {
  const steps = STEPS.filter((step) => !step.element || isVisible(step.element as string));

  const tour = driver({
    steps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Get started",
    disableActiveInteraction: true,
    popoverOffset: 12,
    stagePadding: 6,
    stageRadius: 12,
    overlayColor: "rgb(12 12 16)",
    overlayOpacity: 0.55,
    popoverClass: "tm-tour",
    onDestroyed: markTourSeen,
  });

  tour.drive();
}
