import { localDayNumber } from './datetime';

export interface Quote {
  content: string;
  author: string;
}

/**
 * Bundled quotes: they work offline and need no network permission.
 * Only widely attested quotations are included.
 */
export const QUOTES: readonly Quote[] = [
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { content: 'Well begun is half done.', author: 'Aristotle' },
  { content: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { content: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { content: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { content: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { content: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { content: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius' },
  { content: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
  { content: 'Luck is what happens when preparation meets opportunity.', author: 'Seneca' },
  { content: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
  { content: 'What we think, we become.', author: 'Buddha (attributed)' },
  { content: 'The best way out is always through.', author: 'Robert Frost' },
  { content: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { content: 'You must do the thing you think you cannot do.', author: 'Eleanor Roosevelt' },
  { content: 'Nothing great was ever achieved without enthusiasm.', author: 'Ralph Waldo Emerson' },
  { content: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Henry David Thoreau' },
  { content: 'Go confidently in the direction of your dreams. Live the life you have imagined.', author: 'Henry David Thoreau' },
  { content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill (attributed)' },
  { content: 'Perseverance is not a long race; it is many short races one after the other.', author: 'Walter Elliot' },
  { content: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { content: 'Premature optimization is the root of all evil.', author: 'Donald Knuth' },
  { content: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  { content: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
  { content: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { content: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { content: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { content: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci (attributed)' },
  { content: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { content: 'Stay hungry. Stay foolish.', author: 'Stewart Brand' },
  { content: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { content: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin (attributed)' },
  { content: 'By failing to prepare, you are preparing to fail.', author: 'Benjamin Franklin (attributed)' },
  { content: 'Twenty years from now you will be more disappointed by the things you did not do than by the ones you did.', author: 'H. Jackson Brown Jr.' },
  { content: 'Genius is one percent inspiration and ninety-nine percent perspiration.', author: 'Thomas Edison' },
  { content: 'I have not failed. I have just found 10,000 ways that will not work.', author: 'Thomas Edison (attributed)' },
  { content: 'Imagination is more important than knowledge.', author: 'Albert Einstein' },
  { content: 'Life is like riding a bicycle. To keep your balance, you must keep moving.', author: 'Albert Einstein' },
  { content: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie' },
  { content: 'Be less curious about people and more curious about ideas.', author: 'Marie Curie' },
  { content: 'If I have seen further it is by standing on the shoulders of giants.', author: 'Isaac Newton' },
  { content: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.', author: 'Albert Einstein' },
  { content: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Chinese proverb' },
  { content: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { content: 'A smooth sea never made a skilled sailor.', author: 'English proverb' },
  { content: 'Rome was not built in a day.', author: 'John Heywood' },
  { content: 'Whether you think you can, or you think you cannot, you are right.', author: 'Henry Ford (attributed)' },
  { content: 'Don’t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { content: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney (attributed)' },
  { content: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { content: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { content: 'Concentrate all your thoughts upon the work at hand. The sun’s rays do not burn until brought to a focus.', author: 'Alexander Graham Bell' },
  { content: 'Courage is not the absence of fear, but the triumph over it.', author: 'Nelson Mandela' },
  { content: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle (attributed)' },
  { content: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { content: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { content: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { content: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { content: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { content: 'The harder I work, the luckier I get.', author: 'Samuel Goldwyn (attributed)' },
  { content: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
  { content: 'If you want to go fast, go alone. If you want to go far, go together.', author: 'African proverb' },
];

export const FALLBACK_QUOTE: Quote = QUOTES[0]!;

/** Same quote all day, a different one tomorrow. */
export function quoteOfTheDay(date: Date = new Date()): Quote {
  const index = ((localDayNumber(date) % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[index] ?? FALLBACK_QUOTE;
}

export function randomQuote(exclude?: string, rng: () => number = Math.random): Quote {
  const pool = QUOTES.filter((quote) => quote.content !== exclude);
  return pool[Math.floor(rng() * pool.length)] ?? FALLBACK_QUOTE;
}

interface FreeApiQuoteResponse {
  success?: boolean;
  data?: { content?: string; author?: string };
}

export const ONLINE_QUOTES_URL = 'https://api.freeapi.app/api/v1/public/quotes/quote/random';

/** Optional online source (FreeAPI, no key). Falls back to bundled quotes on any error. */
export async function fetchOnlineQuote(signal?: AbortSignal): Promise<Quote> {
  try {
    const response = await fetch(ONLINE_QUOTES_URL, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as FreeApiQuoteResponse;
    const content = json.data?.content?.trim();
    const author = json.data?.author?.trim();
    if (!content) throw new Error('Empty quote');
    return { content, author: author || 'Unknown' };
  } catch {
    return randomQuote();
  }
}
