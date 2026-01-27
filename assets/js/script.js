let bookData = null;
let allPages = [];
let currentGlobalPage = 0;

// ========== ÁUDIOS ==========
// Som de virada de página
const pageTurnAudio = new Audio("/assets/sound/page-flip.mp3");
pageTurnAudio.volume = 0.7;

// Música ambiente (BGM) - agora gerenciada dinamicamente
let bgMusic = null;
let currentMusicUrl = null;
const defaultVolume = 0.15;

// ========== CONTROLE DE ÁUDIO (VERSÃO COM MÚSICA POR PÁGINA) ==========

// Troca ou inicia a música de fundo
function changeBackgroundMusic(musicUrl) {
    // Se não há URL de música, mantém a atual ou para
    if (!musicUrl) {
        return;
    }
    
    // Se já está tocando a mesma música, não faz nada
    if (currentMusicUrl === musicUrl && bgMusic && !bgMusic.paused) {
        return;
    }
    
    // Para a música atual se existir
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    
    // Cria novo objeto de áudio com a música da página
    bgMusic = new Audio(musicUrl);
    bgMusic.volume = defaultVolume;
    bgMusic.loop = true;
    currentMusicUrl = musicUrl;
    
    // Toca a nova música
    bgMusic.play().catch(error => {
        console.log("Música bloqueada pelo navegador:", error);
    });
}

// Para completamente a música
function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    currentMusicUrl = null;
}

// Abaixa temporariamente o volume durante o som de virar página
function duckBGMusic() {
    if (!bgMusic) return;
    
    const originalVolume = bgMusic.volume;
    bgMusic.volume = 0.05;
    
    setTimeout(() => {
        if (bgMusic) {
            bgMusic.volume = originalVolume;
        }
    }, 1000);
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
  
  const originalColumnContext = container.style.columnCount;
  container.style.columnCount = "1"; 

  bookData.pages.forEach(chapter => {
    const pages = paginateContent(chapter.content);

    pages.forEach((content, index) => {
      allPages.push({
        title: chapter.title,
        content: content,
        image: index === 0 ? chapter.image || null : null,
        imageClass: index === 0 ? chapter.imageClass || null : null, // ← ADICIONE
        music: index === 0 ? chapter.music || null : null, // ← ADICIONE
        isChapterStart: index === 0
      });
    });
  });

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
  const img = document.getElementById("chapterImg");
  
  // Atualiza imagem
  if (page.image) {
    img.src = page.image;
    imageBox.style.display = "block";
    
    if (page.imageClass) {
        img.className = page.imageClass;
    } else {
        img.className = '';
    }
    
    img.onclick = function() {
        openModal(this.src, page.title);
    };
  } else {
    imageBox.style.display = "none";
  }
  
  // ← ADICIONE: Troca música se a página tiver uma
  if (page.music) {
    changeBackgroundMusic(page.music);
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
    
    // Preload do som de virar página
    pageTurnAudio.play().then(() => {
        pageTurnAudio.pause();
        pageTurnAudio.currentTime = 0;
    }).catch(e => console.log("Audio preload falhou."));

    menu.style.display = "none";
    book.style.display = "flex";

    if (document.fonts) {
        await document.fonts.ready;
    }

    setTimeout(() => {
        buildBookPages();
        renderPage('next'); // A música será iniciada aqui
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
