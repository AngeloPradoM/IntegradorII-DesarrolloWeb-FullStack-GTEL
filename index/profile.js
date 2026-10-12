(() => {
 const profile=window.previewProfile.read();
 const slot=document.querySelector('#header-actions');
 slot.replaceChildren();
 const link=document.createElement('a');link.href='editar-perfil.html';link.textContent=profile.nombres+' · Editar perfil';slot.append(link);
})();
