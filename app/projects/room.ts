'use client';

const KEY = 'couple-room-code-v1';

export function getRoomCode() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setRoomCode(code: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, code);
}

