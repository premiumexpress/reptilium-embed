(function() {
    // 1. SETUP SHADOW DOM & STYLES (Keeping the same robust styles)
    const host = document.createElement('div');
    host.id = 'tw-root';
    document.body.appendChild(host);
    const shadow = host.attachShadow({mode: 'closed'});

    const style = document.createElement('style');
    style.textContent = `
        .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 2147483647; justify-content: center; align-items: end; backdrop-filter: blur(4px); }
        .modal { background: white; width: 100%; max-width: 100vw; height: 90%; max-height: 90vh; border-radius: 12px 12px 0px 0px; position: relative; overflow: hidden; }
        .close { position: absolute; top: 15px; right: 15px; border: none; cursor: pointer; z-index: 30; background: #eee; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
        .loader-container { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 10; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0070f3; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        iframe { width: 100%; height: 100%; border: none; opacity: 0; transition: opacity 0.3s; }
        iframe.is-visible { opacity: 1; }
        .hidden { display: none !important; }

        /* Desktop: constrain width and give full corner radius */
        @media (min-width: 1024px) {
            .overlay { align-items: center; }
            .modal { max-width: 80vw; border-radius: 12px; }
        }
    `;
    shadow.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal">
            <button class="close">&times;</button>
            <div class="loader-container"><div class="spinner"></div></div>
            <iframe id="tw-iframe" allow="payment"></iframe>
        </div>
    `;
    shadow.appendChild(overlay);

    const iframe = overlay.querySelector('#tw-iframe');
    const loader = overlay.querySelector('.loader-container');
    const closeBtn = overlay.querySelector('.close');

    let loadedUrl = "";
    let isAppReady = false;
    let preloadHandle = null; // To track the idle callback

    // 2. THE DYNAMIC LOAD FUNCTION
    const startLoading = (url) => {
        if (!url || url === loadedUrl) return;
        
        // If we were waiting for an idle moment, cancel that and do it NOW
        if (preloadHandle) {
            if (window.cancelIdleCallback) window.cancelIdleCallback(preloadHandle);
            else clearTimeout(preloadHandle);
            preloadHandle = null;
        }

        loadedUrl = url;
        iframe.src = url;
    };

    const showModal = (url) => {
        // PRIORITY OVERRIDE: If the URL isn't loading yet, or is different, force start
        if (url !== loadedUrl) {
            isAppReady = false;
            loader.classList.remove('hidden');
            iframe.classList.remove('is-visible');
            startLoading(url);
        }

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Hide loader if React app already sent the 'VV_WIDGET_READY' message
        if (isAppReady) {
            loader.classList.add('hidden');
            iframe.classList.add('is-visible');
        }
    };

    const hideModal = () => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    };

    // 3. EVENT LISTENERS
    window.addEventListener('message', (event) => {
        if (event.data.type === 'VV_WIDGET_READY') {
            isAppReady = true;
            if (overlay.style.display === 'flex') {
                loader.classList.add('hidden');
                iframe.classList.add('is-visible');
            }
        }
        if (event.data === 'VV_WIDGET_CLOSE' || event.data.type === 'CHECKOUT_COMPLETE') hideModal();
    });

    closeBtn.onclick = hideModal;
    overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };

    // 4. INTELLIGENT INITIALIZATION
    const initTrigger = (el) => {
        if (el.classList.contains('vv-widget-trigger') && !el.hasAttribute('data-tw-ready')) {
            el.setAttribute('data-tw-ready', 'true');
            const targetUrl = el.getAttribute('data-url');

            // --- DEFERRED PRE-LOAD (SEO FRIENDLY) ---
            const scheduleLoad = () => {
                if (!loadedUrl) {
                    const work = () => startLoading(targetUrl);
                    if (window.requestIdleCallback) preloadHandle = window.requestIdleCallback(work);
                    else preloadHandle = setTimeout(work, 2000);
                }
            };

            if (document.readyState === 'complete') scheduleLoad();
            else window.addEventListener('load', scheduleLoad);

            // --- IMMEDIATE CLICK (USER PRIORITY) ---
            el.addEventListener('click', (e) => {
                e.preventDefault();
                showModal(targetUrl);
            });
        }
    };

    // Mutation Observer to handle dynamic content
    const observer = new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            if (n.classList.contains('vv-widget-trigger')) initTrigger(n);
            n.querySelectorAll('.vv-widget-trigger').forEach(initTrigger);
        }
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.vv-widget-trigger').forEach(initTrigger);

    window.TicketWidget = { open: showModal, close: hideModal };
})();