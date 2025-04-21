import React from "react";

export default function Prayer({ name, time, icon }) {
  return (
    <div className="pray">
      <i className="wi wi-sunrise">
        <img src={icon} alt="" />
      </i>
      <div className="pray-name">{name}</div>
      <div className="pray-time">{time}</div>
    </div>
  );
}
