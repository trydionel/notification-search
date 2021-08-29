import React from "react";

export const IconButton = ({ children, onClick = null, ...buttonProps }) => {
  const onClickInternal = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  }

  return (
    <button className="button is-small is-ghost" onClick={onClickInternal} style={{ paddingBottom: 0, paddingTop: 0 }} {...buttonProps}>
      <span className="icon">
        { children }
      </span>
    </button>
  )
}