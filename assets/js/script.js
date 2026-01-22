let bookData = null;
let allPages = [];
let currentGlobalPage = 0;

// ========== CARREGAR LIVRO ==========
async function loadBook() {
  try {
    const response = await fetch("book.json");
    bookData = await response.json();

    document.getElementById("menuTitle").textContent = bookData.title;
    document.getElementById("menuDescription").textContent = bookData.description;
    document.getElementById("menuImage").src = bookData.coverImage;

    // Recupera a página salva, se existir
    currentGlobalPage = Number(localStorage.getItem("page")) || 0;
  } catch (error) {
    console.error("Erro ao carregar o ficheiro JSON:", error);
  }
}

// ========== PAGINAR CONTEÚDO ==========
function paginateContent(htmlContent) {
  const container = document.getElementById("pageContent");
  const words = htmlContent.split(" ");
  const pages = [];

  container.innerHTML = "";
  let temp = "";

  for (let word of words) {
    const test = temp + word + " ";
    container.innerHTML = test;

    if (container.scrollHeight > container.clientHeight) {
      pages.push(temp.trim());
      temp = word + " ";
    } else {
      temp = test;
    }
  }

  if (temp.trim()) pages.push(temp.trim());
  return pages;
}

// ========== CONSTRUIR PÁGINAS ==========
function buildBookPages() {
  allPages = [];
  const container = document.getElementById("pageContent");
  container.innerHTML = "";

  bookData.pages.forEach(chapter => {
    const pages = paginateContent(chapter.content);
    pages.forEach((content, index) => {
      allPages.push({
        title: chapter.title,
        content: content,
        image: index === 0 ? chapter.image || null : null
      });
    });
  });
}

// ========== RENDERIZAR PÁGINA ==========
function renderPage() {
  if (allPages.length === 0) return;

  // Garante que o índice não ultrapassa os limites
  if (currentGlobalPage >= allPages.length) currentGlobalPage = allPages.length - 1;
  if (currentGlobalPage < 0) currentGlobalPage = 0;

  const page = allPages[currentGlobalPage];
  const contentArea = document.getElementById("pageContent");

  document.getElementById("pageTitle").innerText = page.title;
  contentArea.innerHTML = page.content;

  // Imagem do Capítulo
  const imageBox = document.getElementById("chapterImage");
  const img = document.getElementById("chapterImg");
  if (page.image) {
    img.src = page.image;
    imageBox.style.display = "block";
  } else {
    imageBox.style.display = "none";
  }

  // Atualiza Rodapé e Botões
  document.getElementById("pageNumber").innerText = 
    `Página ${currentGlobalPage + 1} de ${allPages.length}`;
  
  document.getElementById("prevBtn").disabled = (currentGlobalPage === 0);
  document.getElementById("nextBtn").disabled = (currentGlobalPage === allPages.length - 1);

  localStorage.setItem("page", currentGlobalPage);
}

// ========== NAVEGAÇÃO (CORRIGIDA) ==========
function nextPage() {
  if (currentGlobalPage < allPages.length - 1) {
    currentGlobalPage++;
    renderPage();
  }
}

function previousPage() {
  if (currentGlobalPage > 0) {
    currentGlobalPage--;
    renderPage();
  }
}

// ========== CONTROLES ==========
async function startReading() {
    const menu = document.getElementById("menuContainer");
    const book = document.getElementById("bookContainer");
    
    menu.style.display = "none";
    book.style.display = "flex";

    // Espera as fontes carregarem para o cálculo ser exato
    if (document.fonts) {
        await document.fonts.ready;
    }

    setTimeout(() => {
        buildBookPages();
        renderPage();
    }, 100);
}

function backToMenu() {
    document.getElementById("bookContainer").style.display = "none";
    document.getElementById("menuContainer").style.display = "flex";
}

window.onload = loadBook;