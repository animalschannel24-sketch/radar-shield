import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = "https://grkjvkhukizetjmszllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjMHhHDymhlazNWD8UPr4g_79o03fhZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let municipiosPorUF = new Map();

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

function aplicarMaxLength(id, maximo) {
  const campo = getElement(id);
  if (!campo) return;
  campo.maxLength = maximo;
}

function configurarLimitesHTML() {
  aplicarMaxLength("protocolo", 50);
  aplicarMaxLength("canal-entrada", 50);
  aplicarMaxLength("unidade", 100);
  aplicarMaxLength("nome-associado", 120);
  aplicarMaxLength("doc-associado", 14);
  aplicarMaxLength("id-contrato", 50);
  aplicarMaxLength("placa-veiculo", 7);
  aplicarMaxLength("local-evento", 150);
  aplicarMaxLength("resumo-evento", 1000);
}

function placaValidaCompleta(placa) {
  const placaNormal = letrasENumerosMaiusculos(placa);
  const padraoAntigo = /^[A-Z]{3}[0-9]{4}$/;
  const padraoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

  return padraoAntigo.test(placaNormal) || padraoMercosul.test(placaNormal);
}

function placaParcialValida(placa) {
  const valor = letrasENumerosMaiusculos(placa);

  if (!valor) return true;
  if (valor.length > 7) return false;

  for (let i = 0; i < valor.length; i++) {
    const char = valor[i];

    if (i <= 2) {
      if (!/[A-Z]/.test(char)) return false;
      continue;
    }

    if (i === 3) {
      if (!/[0-9]/.test(char)) return false;
      continue;
    }

    if (i === 4) {
      if (!/[A-Z0-9]/.test(char)) return false;
      continue;
    }

    if (i >= 5 && i <= 6) {
      if (!/[0-9]/.test(char)) return false;
    }
  }

  return true;
}

function limparSelect(select, placeholder) {
  if (!select) return;

  select.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  select.appendChild(option);
}

function preencherSelect(select, opcoes, placeholder) {
  if (!select) return;

  limparSelect(select, placeholder);

  opcoes.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.sigla || item.nome;
    option.textContent = item.rotulo || item.nome || item.sigla;
    select.appendChild(option);
  });
}

async function carregarEstados() {
  const ufSelect = getElement("uf-evento");
  if (!ufSelect) return;

  try {
    const resposta = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await resposta.json();

    estados.sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"));

    const opcoes = estados.map((estado) => ({
      sigla: estado.sigla,
      rotulo: `${estado.sigla} - ${estado.nome}`
    }));

    preencherSelect(ufSelect, opcoes, "Selecione o estado");
  } catch (error) {
    console.error("Erro ao carregar estados:", error);
  }
}

async function carregarCidadesDaUF(uf) {
  const cidadeSelect = getElement("cidade-evento");
  if (!cidadeSelect) return;

  if (!uf) {
    cidadeSelect.disabled = true;
    limparSelect(cidadeSelect, "Selecione primeiro o estado");
    return;
  }

  cidadeSelect.disabled = true;
  limparSelect(cidadeSelect, "Carregando cidades...");

  try {
    if (!municipiosPorUF.has(uf)) {
      const resposta = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const municipios = await resposta.json();

      const nomes = municipios
        .map((municipio) => municipio.nome)
        .sort((a, b) => a.localeCompare(b, "pt-BR"));

      municipiosPorUF.set(uf, nomes);
    }

    const cidades = municipiosPorUF.get(uf) || [];
    const opcoes = cidades.map((nome) => ({ nome }));

    preencherSelect(cidadeSelect, opcoes, "Selecione a cidade");
    cidadeSelect.disabled = false;
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
    limparSelect(cidadeSelect, "Não foi possível carregar as cidades");
    cidadeSelect.disabled = true;
  }
}

function validarCampo(campo, mostrarErroParcial = false) {
  if (!campo) return true;

  const id = campo.id;
  const valor = campo.value?.trim() || "";
  let mensagem = "";

  if (id === "protocolo" && valor.length > 50) {
    mensagem = "O protocolo pode ter no máximo 50 caracteres.";
  }

  if (id === "doc-associado" && valor) {
    const cpf = somenteDigitos(valor);

    if (cpf.length > 11) {
      mensagem = "O CPF deve ter no máximo 11 números.";
    }
  }

  if (id === "placa-veiculo" && valor) {
    if (!placaParcialValida(valor)) {
      mensagem = "A placa começa com 3 letras e depois segue o padrão ABC1234 ou ABC1D23.";
    } else if ((mostrarErroParcial || valor.length === 7) && !placaValidaCompleta(valor)) {
      mensagem = "A placa deve estar em formato válido, como ABC1234 ou ABC1D23.";
    }
  }

  if (id === "uf-evento" && !valor) {
    mensagem = "Selecione o estado do evento.";
  }

  if (id === "cidade-evento") {
    const uf = valorOuNull("uf-evento");

    if (!uf) {
      mensagem = "Selecione primeiro o estado.";
    } else if (!valor) {
      mensagem = "Selecione a cidade do evento.";
    } else {
      const cidades = municipiosPorUF.get(uf) || [];
      if (!cidades.includes(valor)) {
        mensagem = "Selecione uma cidade válida da lista.";
      }
    }
  }

  if (id === "nome-associado" && valor.length > 120) {
    mensagem = "O nome do associado pode ter no máximo 120 caracteres.";
  }

  if (id === "local-evento" && valor.length > 150) {
    mensagem = "O local do evento pode ter no máximo 150 caracteres.";
  }

  if (id === "resumo-evento" && valor.length > 1000) {
    mensagem = "O resumo do evento pode ter no máximo 1000 caracteres.";
  }

  campo.setCustomValidity(mensagem);
  return mensagem === "";
}

function normalizarCampo(campo) {
  if (!campo) return;

  if (campo.id === "doc-associado") {
    campo.value = somenteDigitos(campo.value).slice(0, 11);
  }

  if (campo.id === "placa-veiculo") {
    campo.value = letrasENumerosMaiusculos(campo.value).slice(0, 7);
  }
}

function configurarValidacaoEmTempoReal() {
  const ids = [
    "protocolo",
    "doc-associado",
    "placa-veiculo",
    "uf-evento",
    "cidade-evento",
    "nome-associado",
    "local-evento",
    "resumo-evento"
  ];

  ids.forEach((id) => {
    const campo = getElement(id);
    if (!campo) return;

    campo.addEventListener("input", () => {
      normalizarCampo(campo);

      if (id === "placa-veiculo") {
        validarCampo(campo, true);
        if (!campo.checkValidity()) {
          campo.reportValidity();
        }
        return;
      }

      validarCampo(campo);
    });

    campo.addEventListener("change", () => {
      normalizarCampo(campo);
      validarCampo(campo, true);
    });

    campo.addEventListener("blur", () => {
      normalizarCampo(campo);
      validarCampo(campo, true);
      campo.reportValidity();
    });
  });
}

function validarFormulario() {
  const ids = [
    "protocolo",
    "doc-associado",
    "placa-veiculo",
    "uf-evento",
    "cidade-evento",
    "nome-associado",
    "local-evento",
    "resumo-evento"
  ];

  for (const id of ids) {
    const campo = getElement(id);
    if (!campo) continue;

    normalizarCampo(campo);
    validarCampo(campo, true);

    if (!campo.checkValidity()) {
      campo.reportValidity();
      campo.focus();
      return false;
    }
  }

  const cpfCampo = getElement("doc-associado");
  const cpf = somenteDigitos(valorOuNull("doc-associado"));
  if (cpfCampo && cpf && cpf.length !== 11) {
    cpfCampo.setCustomValidity("O CPF deve ter exatamente 11 números.");
    cpfCampo.reportValidity();
    cpfCampo.focus();
    return false;
  }

  return true;
}

async function salvarCaso(event) {
  event.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const docAssociado = somenteDigitos(valorOuNull("doc-associado"));
  const placaVeiculo = letrasENumerosMaiusculos(valorOuNull("placa-veiculo"));
  const ufEvento = valorOuNull("uf-evento");

  const payload = {
    protocolo: textoLimitado("protocolo", 50),
    data_abertura: dataOuNull("data-abertura"),
    canal_entrada: textoLimitado("canal-entrada", 50),
    unidade: textoLimitado("unidade", 100),
    nome_associado: textoLimitado("nome-associado", 120),
    doc_associado: docAssociado || null,
    id_contrato: textoLimitado("id-contrato", 50),
    placa_veiculo: placaVeiculo || null,
    cidade_evento: valorOuNull("cidade-evento"),
    uf_evento: ufEvento || null,
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

  const cidadeSelect = getElement("cidade-evento");
  if (cidadeSelect) {
    cidadeSelect.disabled = true;
    limparSelect(cidadeSelect, "Selecione primeiro o estado");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  configurarLimitesHTML();
  await carregarEstados();
  configurarValidacaoEmTempoReal();

  const ufSelect = getElement("uf-evento");
  if (ufSelect) {
    ufSelect.addEventListener("change", async () => {
      const cidadeSelect = getElement("cidade-evento");
      await carregarCidadesDaUF(ufSelect.value);

      if (cidadeSelect) {
        cidadeSelect.value = "";
        cidadeSelect.setCustomValidity("");
      }

      ufSelect.setCustomValidity("");
    });
  }

  const form = document.querySelector(".case-form");
  if (form) {
    form.addEventListener("submit", salvarCaso);
  }
});
