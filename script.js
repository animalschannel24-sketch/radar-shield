// script.js

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = "https://grkjvkhukizetjmszllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjMHhHDymhlazNWD8UPr4g_79o03fhZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function salvarCaso(event) {
  event.preventDefault();

  const dataAbertura = document.getElementById("data-abertura").value || null;

  const payload = {
    protocolo: document.getElementById("protocolo").value || null,
    data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : null,
    canal_entrada: document.getElementById("canal-entrada").value || null,
    unidade: document.getElementById("unidade").value || null,
    nome_associado: document.getElementById("nome-associado").value || null,
    doc_associado: document.getElementById("doc-associado").value || null,
    id_contrato: document.getElementById("id-contrato").value || null,
    placa_veiculo: document.getElementById("placa-veiculo").value || null,
    cidade_evento: document.getElementById("cidade-evento").value || null,
    uf_evento: document.getElementById("uf-evento").value || null,
    local_evento: document.getElementById("local-evento").value || null,
    resumo_evento: document.getElementById("resumo-evento").value || null
  };

  const { error } = await supabase.from("cases").insert(payload);

  if (error) {
    alert("Erro ao salvar caso: " + error.message);
  } else {
    alert("Caso salvo com sucesso!");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".case-form");
  if (form) {
    form.addEventListener("submit", salvarCaso);
  }
});
