import React  from "react";
import ReactDOM from "react-dom";
import { NotificationSearch } from "../components/NotificationSearch";

const SearchView = (
  <>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css"></link>
    <div className="container py-5">
      <h1 className="title">Notifications</h1>
      <NotificationSearch />
    </div>
  </>
)

aha.on("search", ({ fields, onUnmounted }, { identifier, settings }) => {
  // Attach to a new shadow root so we get clean styling
  const container = document.createElement("div");
  container.classList.add("notification-search");
  container.attachShadow({ mode: "open" });

  ReactDOM.render(SearchView, container.shadowRoot);

  return container;
});