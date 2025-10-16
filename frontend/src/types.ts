export interface User {
  _id: string;
  username: 'Tino' | 'Misho' | 'Tedak';
  name: string;
  avatar: string;
  description: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Band {
  _id: string;
  name: string;
  image: string;
  spotifyId?: string;
  spotifyUri?: string;
  genres?: string[];
  lastFmId?: string;
  musicBrainzId?: string;
  addedBy?: string;
  createdAt: string;
}

export interface VoteSubmission {
  userId: string;
  bandId: string;
  submittedAt: string;
}

export interface VoteResult {
  bandId: string;
  voteCount: number;
}

export interface Rating {
  userId: string;
  score: number;
  submittedAt: string;
}

export interface Vote {
  _id: string;
  voteNumber: number;
  createdBy: string;
  status: 'active' | 'runoff' | 'rating' | 'completed' | 'tied' | 'archived';
  selectedBands: Band[];
  votes: VoteSubmission[];
  winner?: Band;
  results: VoteResult[];
  ratings: Rating[];
  averageRating: number;
  createdAt: string;
  completedAt?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserContextType {
  user: User | null;
  selectUser: (username: 'Tino' | 'Misho' | 'Tedak') => Promise<void>;
  logout: () => void;
  loading: boolean;
}