import React  from "react";
import { NotificationSearch } from "../components/NotificationSearch";

aha.on("search", ({ fields, onUnmounted }, { identifier, settings }) => {

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css"></link>
      <div className="container py-5">
        <h1 className="title">Notifications</h1>
        <NotificationSearch />
      </div>
    </>
  );
});