import './App.less';
import Layout from "./components/Layout/Layout";
import Main from "./pages/Main/Main";

function App() {

  return (
    <div className="App">
      <Layout>
        <Main />
      </Layout>
    </div>
  );
}

export default App;
