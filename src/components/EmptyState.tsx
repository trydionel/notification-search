import React from "react";

export const EmptyState = ({ children }) => {
  return (
    <div className="columns is-centered mt-5">
      <div className="column is-half has-text-centered is-size-5">
        { children }
      </div>
    </div>
  )
}