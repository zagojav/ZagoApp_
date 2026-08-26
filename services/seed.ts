import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FAMILY_ID, PERSON_ORDER, PERSON_PROFILES } from '@/constants/personProfiles';

const PET_NAMES = ['Arya', 'Oliver', 'Aurora', 'Nico', 'Stan'];

// Idempotent: checks before every write, so it's safe to call on every launch
// without ever overwriting existing data (pin, pinSet, etc.) in the live project.
export async function ensureFamilySeeded(): Promise<void> {
  const familyRef = doc(db, 'families', FAMILY_ID);
  const familySnap = await getDoc(familyRef);
  if (!familySnap.exists()) {
    await setDoc(familyRef, {
      name: 'Casa Zago',
      members: PERSON_ORDER,
      createdAt: serverTimestamp(),
      adminId: 'guilherme',
    });
  }

  for (const id of PERSON_ORDER) {
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const profile = PERSON_PROFILES[id];
      await setDoc(userRef, {
        familyId: FAMILY_ID,
        name: profile.name,
        role: profile.role,
        pinHash: null,
        pinSet: false,
        photoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

// Idempotent: same check-before-create pattern as ensureFamilySeeded — safe
// to call on every launch, never overwrites an existing pet's notes.
export async function ensurePetsSeeded(): Promise<void> {
  for (const name of PET_NAMES) {
    const petRef = doc(db, 'pets', name.toLowerCase());
    const petSnap = await getDoc(petRef);
    if (!petSnap.exists()) {
      await setDoc(petRef, {
        familyId: FAMILY_ID,
        name,
        species: null,
        notes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}
