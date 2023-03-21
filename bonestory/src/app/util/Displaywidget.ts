export function updateModeDisplay(mode, mode2?) {
    const modeDisplayElement = document.getElementById('mode-display');
    const modeDistplybackground = document.getElementById('modewidget');
    if(mode != undefined){
        switch (mode) {
            case 'Camera':
                modeDisplayElement.textContent = 'Camera' + mode2;
                modeDistplybackground.style.backgroundColor = '#60aa85';
                modeDistplybackground.style.border = '1px solid #60aa85';
                break;
            case 'Object':
                modeDisplayElement.textContent = 'Object'+ mode2;
                modeDistplybackground.style.backgroundColor = '#286090';
                modeDistplybackground.style.border = '1px solid #286090';
                break;
            case 'Annotation':
                modeDisplayElement.textContent = 'Annotation'+ mode2;
                modeDistplybackground.style.backgroundColor = '#9210dd';
                modeDistplybackground.style.border = '1px solid #9210dd';
                break;
            case 'Measurement':
                modeDisplayElement.textContent = 'Measurement'+ mode2;
                break;
        }
    }
    else
        modeDisplayElement.textContent = 'Camera';
}