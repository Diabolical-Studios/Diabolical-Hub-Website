document.addEventListener('DOMContentLoaded', () => {
    const isPatron = getIsPatronFromCookie();
    console.log("Is Patron:", isPatron);

    if (isPatron !== null) {
        checkSubscriptionStatusAndUpdateButton(isPatron === "true");
    }
});

function getIsPatronFromCookie() {
    const cookieString = document.cookie.split('; ').find(row => row.startsWith('isPatron='));
    if (cookieString) {
        return cookieString.split('=')[1];
    } else {
        return null;
    }
};

async function checkSubscriptionStatusAndUpdateButton(isPatron) {
    const btn = document.querySelector('.header__btn');
    const btnWrapper = btn.querySelector('.header__btn-wrapper');
    const btnText = btnWrapper.querySelector('.header__btn-text');
    const svg = btnWrapper.querySelector('svg');
    const patronSection = document.getElementById('slide2'); // Select the section by its id

    if (isPatron) {
        btn.onclick = startDownload;
        btnText.textContent = 'Download';
        if (svg) svg.remove();
        patronSection.style.display = 'block'; // Show the section if user is a patron
    }
    else {
        btn.onclick = visitPatreon;
        btnText.textContent = 'Become A Supporter';
        patronSection.style.display = 'none'; // Hide the section if user is not a patron
    }
}

function visitPatreon() {
    window.open("https://www.patreon.com/noctisgame");
}

function startDownload() {
    window.location.href = "URL_TO_YOUR_DOWNLOADABLE_RESOURCE";
}

function getAccessToken() {
    const cookieString = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    if (cookieString) {
        return cookieString.split('=')[1];
    } else {
        return null;
    }
}
