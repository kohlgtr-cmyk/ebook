let bookData = null;
let allPages = [];
let currentGlobalPage = 0;

// ========== ÁUDIOS ==========
// Som de virada de página
const pageTurnAudio = new Audio("/assets/sound/page-flip.mp3");
pageTurnAudio.volume = 0.7; // Volume do som de virar página

// Música ambiente (BGM)
const bgMusic = new Audio("/assets/sound/ambient-music.mp3");
bgMusic.volume = 0.15; // Volume BAIXO para ficar de fundo
bgMusic.loop = true; // Toca em loop infinito

// Variável para controlar se a música já começou
let musicStarted = false;

// ========== CONTROLE DE ÁUDIO ==========

// Inicia a música ambiente
function startBackgroundMusic() {
    if (!musicStarted) {
        bgMusic.play().catch(error => {
            console.log("Música bloqueada pelo navegador. Será iniciada no primeiro clique.");
        });
        musicStarted = true;
    }
}

// Para a música ambiente
function stopBackgroundMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    musicStarted = false;
}

// Abaixa temporariamente o volume da BGM durante o som de virar página
function duckBGMusic() {
    // Salva volume original
    const originalVolume = bgMusic.volume;
    
    // Abaixa para quase inaudível
    bgMusic.volume = 0.05;
    
    // Volta ao volume normal após o som de virar terminar
    setTimeout(() => {
        bgMusic.volume = originalVolume;
    }, 1000); // 1 segundo (duração aproximada do som de virar)
}
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

// ========== PAGINAR CONTEÚDO (VERSÃO MELHORADA) ==========
function paginateContent(htmlContent) {
  const container = document.getElementById("pageContent");
  const paragraphs = htmlContent.match(/<p>.*?<\/p>/g) || []; // Separa por parágrafos completos
  const pages = [];
  
  container.innerHTML = "";
  let currentPage = "";

  for (let paragraph of paragraphs) {
    const testContent = currentPage + paragraph;
    container.innerHTML = testContent;

    // Se ultrapassou o limite, salva a página atual e começa nova
    if (container.scrollHeight > container.clientHeight && currentPage !== "") {
      pages.push(currentPage.trim());
      currentPage = paragraph;
      container.innerHTML = paragraph;
    } else {
      currentPage = testContent;
    }
  }

  // Adiciona última página se houver conteúdo
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages.length > 0 ? pages : [htmlContent]; // Retorna conteúdo original se não conseguir paginar
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
  // Abaixa o volume da música de fundo
  duckBGMusic();
  
  // Toca o som de virar página
  pageTurnAudio.currentTime = 0; 
  pageTurnAudio.play().catch(error => {
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
  const img = document.getElementById("chapterImg"); // ← ADICIONE ESTA LINHA
  
  if (page.image) {
    img.src = page.image;
    imageBox.style.display = "block";
    
    // Aplica classe se definida no JSON
    if (page.imageClass) {
        img.className = page.imageClass;
    } else {
        img.className = '';
    }
    
    // Adiciona evento de clique para abrir modal
    img.onclick = function() {
        openModal(this.src, page.title);
    };
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
    
    // Inicia a música ambiente
    startBackgroundMusic();
    
    // Preload do som de virar página
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
        renderPage('next');
    }, 100);
}

function backToMenu() {
    // Para a música ambiente
    stopBackgroundMusic();
    
    document.getElementById("bookContainer").style.display = "none";
    document.getElementById("menuContainer").style.display = "flex";
}

// ========== MODAL DE IMAGEM ==========
function openModal(imageSrc, caption) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const modalCaption = document.getElementById("modalCaption");
    
    modal.classList.add("show");
    modalImg.src = imageSrc;
    modalCaption.innerHTML = caption || "";
    
    // Previne scroll do fundo
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.classList.remove("show");
    
    // Restaura scroll
    document.body.style.overflow = "auto";
}

// Fechar com tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

window.onload = loadBook;


window.onload = loadBook;
