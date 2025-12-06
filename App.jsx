import { useState } from "react";
import Reg from "./Reg";
import Home from "./Home";
import Login from "./Login";

const App = () => {
  const [x, setx] = useState(0);
  const check = () => {
    if (x === 0) {
      return <Home setx={setx} />;
    } else if (x === 1) {
      return <Reg setx={setx} />;
    } else {
      return <Login setx={setx} />;
    }
  };
  return <>{check()}</>;
};

export default App;
