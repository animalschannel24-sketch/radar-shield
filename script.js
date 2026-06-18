import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = "https://grkjvkhukizetjmszllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjMHhHDymhlazNWD8UPr4g_79o03fhZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getElement(id) {
  return document.getElementById(id);
}

function valorOuNull(id) {
  const elemento = getElement(id);
  if (!elemento) return null;

  const valor = elemento.value?.trim();
  return valor ? valor : null;
}

function textoLimitado(id, maximo) {
  const valor = valorOuNull(id);
  if (!valor) return null;
  return valor.slice(0, maximo);
}

function dataOuNull(id) {
  const valor = valorOuNull(id);
  if (!valor) return null;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function somenteDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

function letrasENumerosMaiusculos(valor) {
  return (valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function validarCampos() {
  const protocolo = valorOuNull("protocolo");
  const docAssociadoBruto = valorOuNull("doc-associado");
  const placaBruta = valorOuNull("placa-veiculo");
  const ufEventoBruta = valorOuNull("uf-evento");

  if (protocolo && protocolo.length > 50) {
    return "O protocolo pode ter no máximo 50 caracteres.";
  }

  if (docAssociadoBruto) {
    const docAssociado = somenteDigitos(docAssociadoBruto);

    if (docAssociado.length < 11) {
      return "O CPF deve ter 11 números.";
    }

    if (docAssociado.length > 11) {
      return "O CPF deve ter no máximo 11 números.";
    }
  }

  if (placaBruta) {
    const placa = letrasENumerosMaiusculos(placaBruta);

    if (placa.length < 7) {
      return "A placa deve ter 7 caracteres.";
    }

    if (placa.length > 7) {
      return "A placa deve ter exatamente 7 caracteres.";
    }
  }

  if (ufEventoBruta) {
    const ufEvento = ufEventoBruta.trim().toUpperCase();

    if (ufEvento.length !== 2) {
      return "A UF deve ter exatamente 2 letras.";
    }
  }

  const nomeAssociado = valorOuNull("nome-associado");
  if (nomeAssociado && nomeAssociado.length > 120) {
    return "O nome do associado pode ter no máximo 120 caracteres.";
  }

  const cidadeEvento = valorOuNull("cidade-evento");
  if (cidadeEvento && cidadeEvento.length > 80) {
    return "A cidade do evento pode ter no máximo 80 caracteres.";
  }

  const localEvento = valorOuNull("local-evento");
  if (localEvento && localEvento.length > 150) {
    return "O local do evento pode ter no máximo 150 caracteres.";
  }

  const resumoEvento = valorOuNull("resumo-evento");
  if (resumoEvento && resumoEvento.length > 1000) {
    return "O resumo do evento pode ter no máximo 1000 caracteres.";
  }

  return null;
}

async function salvarCaso(event) {
  event.preventDefault();

  const erroValidacao = validarCampos();
  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  const docAssociado = somenteDigitos(valorOuNull("doc-associado"));
  const placaVeiculo = letrasENumerosMaiusculos(valorOuNull("placa-veiculo"));
  const ufEvento = valorOuNull("uf-evento")?.trim().toUpperCase() || null;

  const payload = {
    protocolo: textoLimitado("protocolo", 50),
    data_abertura: dataOuNull("data-abertura"),
    canal_entrada: textoLimitado("canal-entrada", 50),
    unidade: textoLimitado("unidade", 100),
    nome_associado: textoLimitado("nome-associado", 120),
    doc_associado: docAssociado || null,
    id_contrato: textoLimitado("id-contrato", 50),
    placa_veiculo: placaVeiculo || null,
    cidade_evento: textoLimitado("cidade-evento", 80),
    uf_evento: ufEvento,
    local_evento: textoLimitado("local-evento", 150),
    resumo_evento: textoLimitado("resumo-evento", 1000),

    case_number: textoLimitado("protocolo", 50),
    origin: textoLimitado("canal-entrada", 50),
    exception_details: textoLimitado("resumo-evento", 1000),
    status: "aberto"
  };

  const { error } = await supabase.from("cases").insert(payload);

  if (error) {
    alert("Erro ao salvar caso: " + error.message);
    return;
  }

  alert("Caso salvo com sucesso!");

  const form = document.querySelector(".case-form");
  if (form) {
    form.reset();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".case-form");

  if (form) {
    form.addEventListener("submit", salvarCaso);
  }
});
