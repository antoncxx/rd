import './App.css';
import RemoteDesktop from './RemoteDesktop';

function App() {
  return (
    <div className="App">
      <RemoteDesktop url="ws://bpcw2eiw1qkghzr3wa3deeldrswqafo0.devserver.home:4444/wallguard/gateway/rd" />
    </div>
  );
}

export default App;
