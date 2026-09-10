import { Timestamp } from 'firebase/firestore';

export type PersonId = 'guilherme' | 'amanda' | 'renata' | 'vander' | 'emanuella' | 'lucas';
export type UserRole = 'admin' | 'member';

// === families ===
export interface Family {
  id: string; // 'casa-zago'
  name: string;
  members: PersonId[];
  createdAt: Timestamp;
  adminId: PersonId;
}

// === users ===
export interface FamilyUser {
  id: PersonId; // doc id == slug, deterministic
  familyId: string;
  name: string;
  role: UserRole;
  pinHash: string | null; // sha256 of the 4-digit PIN — never plaintext
  pinSet: boolean;
  photoUrl: string | null; // Cloudinary secure_url, overrides the bundled default avatar
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === sharedActivities ===
export type ActivityFrequency = 'daily' | 'weekly' | 'once';

// Keyed by occurrence date in 'DD/MM/YYYY' format (same format the calendar
// screens use), so every occurrence of a recurring activity has its own
// completion record instead of one flag for the whole document.
export interface ActivityCompletion {
  completedBy: PersonId;
  completedByName: string;
  completedAt: Timestamp;
}

export interface SharedActivity {
  id: string;
  familyId: string;
  createdBy: PersonId;
  createdByName: string;
  title: string;
  description: string;
  assignedTo: PersonId | null;
  frequency: ActivityFrequency;
  daysOfWeek: number[]; // 0=domingo .. 6=sábado, used when frequency === 'weekly'
  date: string | null; // 'DD/MM/YYYY', used when frequency === 'once'
  completions: Record<string, ActivityCompletion>;
  createdAt: Timestamp;
}

// === personalNotes (organizational privacy only — see Firestore rules) ===
export interface PersonalNote {
  id: string;
  familyId: string;
  userId: PersonId;
  date: Timestamp;
  content: string;
  color: string;
  createdAt: Timestamp;
}

// === apostas ===
export type ApostaStatus = 'active' | 'closed' | 'result_posted';

export interface ApostaResult {
  winner: string;
  scoreboard: string;
}

export interface Aposta {
  id: string;
  familyId: string;
  createdBy: PersonId;
  createdByName: string;
  title: string;
  description: string;
  type: 'futebol' | 'geral' | string;
  status: ApostaStatus;
  result: ApostaResult | null;
  resultPostedBy: PersonId | null;
  resultPostedByName: string | null;
  createdAt: Timestamp;
  closedAt: Timestamp | null;
  resultPostedAt: Timestamp | null;
}

// === apostas_predictions ===
export type PredictionPoints = 0 | 1 | 3;
export type PredictionPointsReason = 'acertou_placar' | 'acertou_vencedor' | 'errou';

export interface ApostaPredictionValue {
  winner: string;
  scoreboard: string;
}

export interface ApostaPrediction {
  id: string;
  familyId: string;
  betId: string;
  userId: PersonId;
  userName: string;
  prediction: ApostaPredictionValue;
  points: PredictionPoints;
  pointsReason: PredictionPointsReason | null;
  createdAt: Timestamp;
}

// === shopping_lists ===
export type ShoppingCategory = 'Compra do mês' | 'Compra da semana' | 'Compra de necessidade';

export interface ShoppingListItem {
  id: string;
  product: string;
  quantity: string;
  category: ShoppingCategory;
  checked: boolean;
  checkedBy: PersonId | null;
  checkedAt: Timestamp | null;
  checkedByName: string | null;
  addedBy: PersonId;
  addedByName: string;
  createdAt: Timestamp;
}

export interface ShoppingList {
  id: string;
  familyId: string;
  name: string; // 'Mercado' | 'Farmácia' | custom
  items: ShoppingListItem[];
  shoppingNow: PersonId | null;
  shoppingNowName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === pets ===
export type PetSpecies = 'Gato' | 'Cachorro' | 'Outro';

export interface PetNote {
  id: string;
  subject: string;
  date: Timestamp;
  createdBy: PersonId;
  createdByName: string;
  createdAt: Timestamp;
}

export interface Pet {
  id: string;
  familyId: string;
  name: string; // Arya, Oliver, Aurora, Nico, Stan
  species: PetSpecies | null;
  notes: PetNote[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === ranking ===
export interface RankingEntry {
  id: string; // == userId
  familyId: string;
  userId: PersonId;
  userName: string;
  totalPoints: number;
  betsParticipated: number;
  betsWon: number;
  betsParcial: number;
  updatedAt: Timestamp;
}

// === markets ===
// Lojas físicas onde a família compra. Cadastradas pela própria família —
// não há integração com nenhuma API externa de mercado.
export interface Market {
  id: string;
  familyId: string;
  name: string; // 'São Vicente'
  location: string; // 'Barueri' — livre, só pra distinguir filiais
  createdAt: Timestamp;
}

// === priceItems ===
export type PriceCategory =
  | 'Grãos'
  | 'Frios'
  | 'Bebidas'
  | 'Limpeza'
  | 'Hortifruti'
  | 'Higiene'
  | 'Carnes'
  | 'Padaria'
  | 'Outros';

export const PRICE_CATEGORIES: PriceCategory[] = [
  'Grãos', 'Frios', 'Bebidas', 'Limpeza', 'Hortifruti',
  'Higiene', 'Carnes', 'Padaria', 'Outros',
];

// Um preço observado de um produto em um mercado. Vive dentro do array
// `prices` do PriceItem — um registro por mercado, sobrescrito quando o
// mesmo produto é escaneado de novo na mesma loja.
export interface MarketPrice {
  marketId: string;
  marketName: string; // desnormalizado: a lista agrupada não precisa ler `markets`
  price: number;
  updatedAt: Timestamp;
  updatedBy: PersonId;
  updatedByName: string;
}

export interface PriceItem {
  id: string;
  familyId: string;
  productName: string;
  // Forma canônica do productName (minúsculo, sem acento, sem pontuação),
  // gravada junto pra permitir o match "esse produto já existe?" sem
  // baixar e normalizar a coleção inteira a cada save.
  normalizedName: string;
  category: PriceCategory;
  prices: MarketPrice[];
  createdBy: PersonId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
