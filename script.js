document.addEventListener('DOMContentLoaded', () => {
    const openMenuBtn = document.getElementById('open-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnGoMenu = document.getElementById('btn-go-menu');
    const btnHeaderSconti = document.getElementById('btn-header-sconti');
    const btnGameToMenu = document.getElementById('btn-game-to-menu');

    
    const pizzaModal = document.getElementById('pizza-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalExtra = document.getElementById('modal-extra');
    const modalPrice = document.getElementById('modal-price');
    const modalDiscountBox = document.getElementById('modal-discount-box');
    const modalOldPrice = document.getElementById('modal-old-price');
    const modalDiscountBadge = document.getElementById('modal-discount-badge');
    const modalFinalPrice = document.getElementById('modal-final-price');
    const menuCards = document.querySelectorAll('.menu-card');

    const STORAGE_KEY = 'luigia_sconti_daily_v1';
    const MAX_ATTEMPTS = 3;

   
    function formatCurrency(value) {
        return 'R$ ' + value.toFixed(2).replace('.', ',');
    }

  
    function getActiveDiscount() {
        const today = getTodayString();
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (savedData && savedData.date === today && savedData.wonDiscount) {
            return Number(savedData.wonDiscount);
        }
        return 0;
    }

   
    function openMenu() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        sidebar.classList.remove('active');
        if (!pizzaModal.classList.contains('active')) {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (openMenuBtn) openMenuBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);

   
    function switchTab(targetTabId) {
        tabContents.forEach(tab => tab.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetTab = document.getElementById(targetTabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        const activeNav = document.querySelector(`.nav-item[data-tab="${targetTabId}"]`);
        if (activeNav) activeNav.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenu();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');
            switchTab(targetTabId);
        });
    });

    if (btnGoMenu) {
        btnGoMenu.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('cardapio-tab');
        });
    }

    if (btnHeaderSconti) {
        btnHeaderSconti.addEventListener('click', () => {
            switchTab('sconti-tab');
        });
    }

    if (btnGameToMenu) {
        btnGameToMenu.addEventListener('click', () => {
            switchTab('cardapio-tab');
        });
    }

    
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            const basePrice = parseFloat(card.getAttribute('data-price'));
            const activeDiscount = getActiveDiscount();

            modalTitle.textContent = card.getAttribute('data-title');
            modalDesc.textContent = card.getAttribute('data-desc');
            modalExtra.textContent = card.getAttribute('data-extra') || '';

            if (activeDiscount > 0) {
                const discountedPrice = basePrice * (1 - activeDiscount / 100);

                modalPrice.classList.add('hidden');
                modalDiscountBox.classList.remove('hidden');

                modalOldPrice.textContent = formatCurrency(basePrice);
                modalDiscountBadge.textContent = `-${activeDiscount}% SCONTO`;
                modalFinalPrice.textContent = formatCurrency(discountedPrice);
            } else {
                modalDiscountBox.classList.add('hidden');
                modalPrice.classList.remove('hidden');
                modalPrice.textContent = formatCurrency(basePrice);
            }

            pizzaModal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        pizzaModal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeMenu();
            closeModal();
        });
    }

  
    const memoryBoard = document.getElementById('memory-board');
    const attemptsCountEl = document.getElementById('attempts-count');
    const resultBox = document.getElementById('game-result-box');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const couponContainer = document.getElementById('coupon-container');
    const couponCodeEl = document.getElementById('coupon-code');
    const copyCouponBtn = document.getElementById('copy-coupon-btn');

    function getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function generateShuffledDeck() {
        const possibleDiscounts = [10, 15, 20, 25, 30, 35, 40, 50];
        const others = possibleDiscounts.filter(d => d !== 50).sort(() => Math.random() - 0.5).slice(0, 3);
        const chosen = [...others, 50];
        const deck = [...chosen, ...chosen];

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    let attemptsLeft = MAX_ATTEMPTS;
    let flippedCards = [];
    let lockBoard = false;
    let gameOver = false;

    function initMemoryGame() {
        if (!memoryBoard) return;

        const today = getTodayString();
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

        if (savedData && savedData.date === today && savedData.finished) {
            attemptsLeft = savedData.attemptsLeft;
            attemptsCountEl.textContent = attemptsLeft;
            gameOver = true;
            lockBoard = true;

            renderBoard(savedData.deck || generateShuffledDeck(), true);

            if (savedData.wonDiscount) {
                showWinState(savedData.wonDiscount, true);
            } else {
                showLoseState(true);
            }
            return;
        }

        const deck = generateShuffledDeck();
        attemptsLeft = MAX_ATTEMPTS;
        attemptsCountEl.textContent = attemptsLeft;
        gameOver = false;
        lockBoard = false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: today,
            attemptsLeft: attemptsLeft,
            finished: false,
            wonDiscount: null,
            deck: deck
        }));

        renderBoard(deck, false);
    }

    function renderBoard(deck, disabled) {
        memoryBoard.innerHTML = '';
        deck.forEach((discount, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            if (disabled) card.style.opacity = '0.6';
            card.dataset.discount = discount;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">
                        <span>LUIGIA</span>
                        <small>SCONTO</small>
                    </div>
                    <div class="memory-card-back">
                        <strong>${discount}%</strong>
                        <span>DI SCONTO</span>
                    </div>
                </div>
            `;

            if (!disabled) {
                card.addEventListener('click', () => handleCardClick(card));
            }
            memoryBoard.appendChild(card);
        });
    }

    function handleCardClick(card) {
        if (lockBoard || gameOver) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        lockBoard = true;
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.discount === card2.dataset.discount;

        if (isMatch) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            const wonDiscount = card1.dataset.discount;
            gameOver = true;

            saveDailyResult(true, wonDiscount);
            setTimeout(() => showWinState(wonDiscount, false), 500);
        } else {
            attemptsLeft--;
            attemptsCountEl.textContent = attemptsLeft;

            if (attemptsLeft <= 0) {
                gameOver = true;
                saveDailyResult(true, null);
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    showLoseState(false);
                }, 900);
            } else {
                saveDailyResult(false, null);
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    flippedCards = [];
                    lockBoard = false;
                }, 950);
            }
        }
    }

    function saveDailyResult(finished, wonDiscount) {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        current.date = getTodayString();
        current.attemptsLeft = attemptsLeft;
        current.finished = finished;
        current.wonDiscount = wonDiscount;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }

    function showWinState(discount, alreadyPlayed) {
        resultBox.classList.remove('hidden');
        couponContainer.classList.remove('hidden');
        resultTitle.textContent = alreadyPlayed
            ? `Hai già vinto il ${discount}% di sconto oggi!`
            : `Complimenti! Hai vinto il ${discount}% di sconto!`;
        resultMessage.textContent = "Lo sconto è già stato applicato ai prezzi nel menu. Presenta questo codice al momento dell'ordine!";
        couponCodeEl.textContent = `LUIGIA${discount}`;
    }

    function showLoseState(alreadyPlayed) {
        resultBox.classList.remove('hidden');
        couponContainer.classList.add('hidden');
        resultTitle.textContent = alreadyPlayed
            ? "Tentativi esauriti per oggi"
            : "Peccato! Hai esaurito i 3 tentativi";
        resultMessage.textContent = "Non hai trovato nessuna coppia oggi, ma la nostra vera pizza napoletana ti aspetta. Riprova domani per una nuova possibilità!";
    }

    if (copyCouponBtn) {
        copyCouponBtn.addEventListener('click', () => {
            const code = couponCodeEl.textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyCouponBtn.textContent = 'COPIATO!';
                setTimeout(() => {
                    copyCouponBtn.textContent = 'COPIA';
                }, 2000);
            });
        });
    }

    initMemoryGame();
});
