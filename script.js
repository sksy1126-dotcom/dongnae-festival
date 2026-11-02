const modal = document.getElementById('mediaModal');
const modalContent = document.getElementById('modalContent');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');
const modalPrev = document.getElementById('mediaPrev') || document.getElementById('modalPrev');
const modalNext = document.getElementById('mediaNext') || document.getElementById('modalNext');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav') || document.querySelector('.site-header .main-nav');
let currentImages = [];
let currentIndex = 0;

function getImageItems() {
  return [...document.querySelectorAll('[data-open-image]')].map(el => ({
    src: el.getAttribute('data-open-image'),
    alt: el.querySelector('img')?.alt || el.getAttribute('aria-label') || 'Festival image'
  }));
}

// 모달 열기 함수 (안정적인 비디오 로드 및 재생 처리)
function openModal(type, src, alt = '') {
  if (!modal || !modalContent) return;
  modalContent.innerHTML = '';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modalCaption.textContent = alt || '';
  
  if (modalPrev) modalPrev.style.display = type === 'image' ? '' : 'none';
  if (modalNext) modalNext.style.display = type === 'image' ? '' : 'none';

  if (type === 'video') {
    const video = document.createElement('video');
    
    // 비디오 속성 사전 설정
    video.controls = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-label', 'Festival promotional video');
    
    // 모달창 크기에 딱 맞추는 CSS 레이아웃 스타일
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.maxHeight = '80vh';
    video.style.objectFit = 'contain';
    
    // 최종 보정된 순수 문자열 경로 주입
    video.src = src;
    
    modalContent.appendChild(video);
    modalCaption.textContent = 'DONGNAE EUPSEONG FESTIVAL · VIDEO';

    // 모달 안착 후 0.1초 후에 재생 실행
    setTimeout(() => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("자동 재생 제한 또는 파일 미완료 상태입니다.", error);
        });
      }
    }, 100);

  } else {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || 'Festival image';
    modalContent.appendChild(img);
  }
}

function openImageAt(index) {
  if (!currentImages.length) currentImages = getImageItems();
  currentIndex = (index + currentImages.length) % currentImages.length;
  const item = currentImages[currentIndex];
  openModal('image', item.src, item.alt);
}

function closeModal() {
  if (!modal || !modalContent) return;
  const video = modalContent.querySelector('video');
  if (video) { 
    video.pause(); 
    video.removeAttribute('src'); 
    video.load(); 
  }
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  modalContent.innerHTML = '';
}

// 클릭 이벤트 리스너 통합 관리 (★배열 탈출 버그 수정 완료★)
document.addEventListener('click', event => {
  const imageTrigger = event.target.closest('[data-open-image]');
  const videoTrigger = event.target.closest('[data-open-video]');
  
  if (imageTrigger) {
    currentImages = getImageItems();
    const src = imageTrigger.getAttribute('data-open-image');
    const idx = currentImages.findIndex(item => item.src === src);
    openImageAt(idx >= 0 ? idx : 0);
  } else if (videoTrigger) {
    // 버튼에 들어있는 오리지널 비디오 속성 주소를 가져옵니다.
    let rawSrc = videoTrigger.getAttribute('data-open-video') || '';
    
    // 만약 데이터에 배열 형태나 #t= 찌꺼기가 남아있는 경우를 완벽하게 차단하기 위한 필터링
    let cleanSrc = String(rawSrc); // 강제로 순수 문자열 타입으로 변환
    
    if (cleanSrc.includes('#')) {
      // 찌꺼기 문자열 분리 후 첫 번째 원소[0]인 비디오 파일명만 텍스트로 안전하게 추출합니다.
      cleanSrc = cleanSrc.split('#')[0]; 
    }
    
    // 혹시 모를 경로 누락을 막기 위해 맨 앞이 파일명으로 시작하면 자동으로 './'을 붙여 안전 경로로 보정
    if (cleanSrc && !cleanSrc.startsWith('.') && !cleanSrc.startsWith('/')) {
      cleanSrc = './' + cleanSrc;
    }
    
    // 최종 보정 완료된 순수 문자열 주소 전달
    openModal('video', cleanSrc);
  }
});

if (modalClose) modalClose.addEventListener('click', closeModal);
modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
if (modalPrev) modalPrev.addEventListener('click', () => openImageAt(currentIndex - 1));
if (modalNext) modalNext.addEventListener('click', () => openImageAt(currentIndex + 1));

document.addEventListener('keydown', event => {
  if (!modal || !modal.classList.contains('open')) return;
  if (event.key === 'Escape') closeModal();
  if (event.key === 'ArrowLeft') openImageAt(currentIndex - 1);
  if (event.key === 'ArrowRight') openImageAt(currentIndex + 1);
});

// 미디어 탭 필터링 기능
document.querySelectorAll('.media-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.media-tab').forEach(item => item.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    document.querySelectorAll('.media-item').forEach(item => {
      item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
    });
  });
});

// 다국어 처리 기능 (ko / en)
function setLanguage(lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'ko';
  document.querySelectorAll('[data-ko][data-en]').forEach(el => {
    const value = el.dataset[lang];
    if (value !== undefined) el.innerHTML = value;
  });
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  try { localStorage.setItem('dongnae-language', lang); } catch (_) {}
}
document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
try {
  if (localStorage.getItem('dongnae-language') === 'en') setLanguage('en');
} catch (_) {}

// 페이지 내 검색 및 스크롤 이동 기능
const searchAction = document.querySelector('.search-action');
const searchButton = document.querySelector('.search-btn');
function showSearch() {
  const query = window.prompt(document.documentElement.lang === 'en' ? 'Enter a search term' : '검색어를 입력하세요');
  if (!query) return;
  const target = [...document.querySelectorAll('h1,h2,h3,p,a,button')].find(el => el.textContent.toLowerCase().includes(query.toLowerCase()));
  if (target) {
    target.scrollIntoView({behavior:'smooth', block:'center'});
    target.classList.add('search-highlight');
    setTimeout(() => target.classList.remove('search-highlight'), 1600);
  } else {
    window.alert(document.documentElement.lang === 'en' ? 'No matching content found on this demo page.' : '이 시안 페이지에서 일치하는 내용을 찾지 못했습니다.');
  }
}
searchAction?.addEventListener('click', showSearch);
searchButton?.addEventListener('click', showSearch);

// 네비게이션 모바일 메뉴 토글
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '×' : '☰';
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.textContent = '☰';
}));

// 상단 히어로 비디오 자동재생 예외 처리
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  const promise = heroVideo.play();
  if (promise && typeof promise.catch === 'function') promise.catch(() => {});
}

// 상단 리브랜딩 오픈 공지 닫기
document.querySelectorAll('.announcement-close').forEach((button) => {
  button.addEventListener('click', () => {
    const bar = button.closest('.announcement-bar');
    if (bar) bar.classList.add('is-hidden');
  });
});


// 2027 동래읍성역사문화축제 카운트다운 (한국 표준시 기준)
(function initFestivalCountdown(){
  const dayEl=document.getElementById('countdownDays');
  if(!dayEl) return;
  const hourEl=document.getElementById('countdownHours');
  const minuteEl=document.getElementById('countdownMinutes');
  const secondEl=document.getElementById('countdownSeconds');
  const ddayEl=document.getElementById('countdownDday');
  // 2027년 10월 15일 00:00:00, 대한민국 표준시
  const target=new Date('2027-10-15T00:00:00+09:00').getTime();
  const pad=value=>String(value).padStart(2,'0');
  function updateCountdown(){
    const remaining=target-Date.now();
    if(remaining<=0){
      dayEl.textContent='000'; hourEl.textContent='00'; minuteEl.textContent='00'; secondEl.textContent='00';
      if(ddayEl) ddayEl.textContent='D-DAY';
      return;
    }
    const totalSeconds=Math.floor(remaining/1000);
    const days=Math.floor(totalSeconds/86400);
    const hours=Math.floor((totalSeconds%86400)/3600);
    const minutes=Math.floor((totalSeconds%3600)/60);
    const seconds=totalSeconds%60;
    dayEl.textContent=String(days).padStart(3,'0');
    hourEl.textContent=pad(hours); minuteEl.textContent=pad(minutes); secondEl.textContent=pad(seconds);
    if(ddayEl) ddayEl.textContent=`D-${days}`;
  }
  updateCountdown();
  window.setInterval(updateCountdown,1000);
})();
