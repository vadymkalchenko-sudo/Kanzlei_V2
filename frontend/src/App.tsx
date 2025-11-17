import AkteForm from "./components/AkteForm";

function App() {
  return (
    <main>
      <header>
        <h1>Kanzlei Management System</h1>
        <p>
          JSONB-Zusatzdaten und Konfliktprüfung direkt aus dem Browser testen. Port
          3003 ist fest eingestellt.
        </p>
      </header>

      <section>
        <AkteForm />
      </section>
    </main>
  );
}

export default App;

