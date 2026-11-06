import React from 'react';
export function ProfileScope({mode,userId,children}) {return React.createElement(React.Fragment,{key:mode+':'+(userId||'demo')},children);}
