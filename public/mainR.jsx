import React from 'react';
import ReactDOM from 'react-dom';
import greet from "./greeter.js";

const title = 'My Minimal React Webpack Babel Setup';

ReactDOM.render(
  <div>{title}</div>,
  document.getElementById('app')
);
console.log("hello");
greet();
