let bookData = null;
let allPages = [];
let currentGlobalPage = 0;

// URL de um som de virada de página (papel grosso/livro antigo)
const pageTurnAudio = new Audio("/assets/sound/page-flip.mp3");
// Dica: Reduz um pouco o volume para não ficar irritante
pageTurnAudio.volume = 0.5;
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
  
  // Temporariamente removemos as colunas para uma medição precisa
  const originalColumnContext = container.style.columnCount;
  container.style.columnCount = "1"; 

  bookData.pages.forEach(chapter => {
    // paginateContent agora retorna um array de strings (páginas)
    const pages = paginateContent(chapter.content);

    pages.forEach((content, index) => {
      allPages.push({
        title: chapter.title,
        content: content,
        image: index === 0 ? chapter.image || null : null,
        isChapterStart: index === 0 // Marca se é a primeira página do capítulo
      });
    });
  });

  // Devolvemos o controle de colunas para o CSS (media queries)
  container.style.columnCount = ""; 
}

function playTurnSound() {
  // Reinicia o áudio para 0, permitindo tocar rápido se o usuário clicar várias vezes
  pageTurnAudio.currentTime = 0; 
  pageTurnAudio.play().catch(error => {
    // Ignora erros de "autoplay" caso o navegador bloqueie antes do primeiro clique
    console.log("Áudio bloqueado ou não carregado:", error);
  });
}
// ========== RENDERIZAR PÁGINA ==========
function renderPage(direction) {
  if (allPages.length === 0) return;

  const bookElement = document.querySelector(".book");
  const contentArea = document.getElementById("pageContent");

  // SE houver uma direção (next ou prev), toca o som e inicia a animação
  if (direction) {
    playTurnSound(); // <--- O SOM TOCA AQUI
    
    // Define a classe de animação baseada na direção
    if (direction === 'next') {
        bookElement.classList.add("flipping-next");
    } else if (direction === 'prev') {
        bookElement.classList.add("flipping-prev");
    }
  }

  contentArea.classList.add("changing"); // Adicionado para o efeito de fade

  setTimeout(() => {
    const page = allPages[currentGlobalPage];
    
    // Troca o conteúdo aqui
    document.getElementById("pageTitle").innerText = page.title;
    contentArea.innerHTML = page.content;

    // Atualiza o resto (imagem, página, etc)
    updateLayoutExtras(page); 
    
    localStorage.setItem("page", currentGlobalPage);
  }, 400); 

  // Limpa as classes para permitir nova virada
  setTimeout(() => {
    bookElement.classList.remove("flipping-next", "flipping-prev");
    contentArea.classList.remove("changing");
  }, 800);
}

// Função auxiliar para organizar o código
function updateLayoutExtras(page) {
  const imageBox = document.getElementById("chapterImage");
  if (page.image) {
    document.getElementById("chapterImg").src = page.image;
    imageBox.style.display = "block";
  } else {
    imageBox.style.display = "none";
  }
  document.getElementById("pageNumber").innerText = `${currentGlobalPage + 1}/${allPages.length}`;
  document.getElementById("prevBtn").disabled = (currentGlobalPage === 0);
  document.getElementById("nextBtn").disabled = (currentGlobalPage === allPages.length - 1);
}

function nextPage() { // Mantenha apenas ESTA versão
  if (currentGlobalPage < allPages.length - 1) {
    currentGlobalPage++;
    renderPage('next');
  }
}

function previousPage() {
  if (currentGlobalPage > 0) {
    currentGlobalPage--;
    renderPage('prev');
  }
}
// ========== CONTROLES ==========
async function startReading() {
    const menu = document.getElementById("menuContainer");
    const book = document.getElementById("bookContainer");
    
    pageTurnAudio.play().then(() => {
        pageTurnAudio.pause();
        pageTurnAudio.currentTime = 0;
    }).catch(e => console.log("Audio preload falhou, mas tentaremos novamente na virada."));

    menu.style.display = "none";
    book.style.display = "flex";

    // Espera as fontes carregarem para o cálculo ser exato
    if (document.fonts) {
        await document.fonts.ready;
    }

    setTimeout(() => {
        buildBookPages();
        renderPage('next'); // ← Adicione 'next' aqui
    }, 100);
}

function backToMenu() {
    document.getElementById("bookContainer").style.display = "none";
    document.getElementById("menuContainer").style.display = "flex";
}




window.onload = loadBook;
