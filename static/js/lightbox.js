(function () {
    const overlay = document.getElementById('img-lightbox');
    const overlayImg = document.getElementById('img-lightbox-img');

    document.querySelectorAll('div.content_section_text img').forEach(function (img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function () {
            overlayImg.src = img.src;
            overlayImg.alt = img.alt;
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        });
    });

    function close() {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });
}());
