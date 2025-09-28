// Get dates relative to today
const getDateDaysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

export const sampleJournalEntries = [
  // Recent entries (last week)
  {
    id: `entry-${getDateDaysAgo(1)}`,
    date: getDateDaysAgo(1), // Yesterday
    content: "Had an interesting conversation with a colleague today about the balance between ambition and <a href=\"#\" class=\"note-link text-primary hover:text-primary/80 underline cursor-pointer\" data-note-id=\"note-contentment-1\" contenteditable=\"false\">contentment</a>. She mentioned how she's been reading about Stoicism and how it's helping her focus on what she can control rather than worrying about outcomes. Made me think about my own relationship with goals and whether I'm putting too much pressure on myself to achieve certain milestones.\n\nEvening reflection: Still thinking about this conversation. There's something freeing about accepting that some things are beyond our control. Going to try applying this mindset to my current project stress.",
    lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(2)}`,
    date: getDateDaysAgo(2),
    content: "Took a long walk in the park this morning before work. There's something about being in nature that helps me process thoughts more clearly. Noticed how the early morning light filtered through the trees and how peaceful everything felt before the city woke up.\n\nLater: Kept thinking about that morning walk throughout my workday. Maybe I should make this a regular habit instead of just an occasional thing. The clarity it brought stayed with me for hours.",
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(3)}`,
    date: getDateDaysAgo(3),
    content: "Reading 'The Power of Now' and the concept of presence is starting to click. Eckhart Tolle writes about how most of our suffering comes from dwelling on the past or worrying about the future. Tried practicing this during my commute today - just focusing on what I could see, hear, and feel in the moment. It was surprisingly calming.",
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(4)}`,
    date: getDateDaysAgo(4),
    content: "Realized I've been avoiding writing lately because I keep thinking it needs to be profound or insightful. But maybe the point isn't to create something meaningful every time - maybe it's just about showing up and putting thoughts on paper. Even mundane observations or random thoughts might be valuable in their own way.\n\nNote to self: Lower the bar. Just write.",
    lastModified: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(5)}`,
    date: getDateDaysAgo(5),
    content: "Coffee with Sarah was exactly what I needed. We talked about career changes, relationships, and that feeling of being in transition. It's comforting to know that someone else is also figuring things out as they go. Sometimes the most valuable conversations are the ones where you don't try to solve anything - just witness each other's experience.",
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(6)}`,
    date: getDateDaysAgo(6),
    content: "Been thinking about the concept of authenticity lately. What does it mean to be truly authentic? Is it about being consistent with who you've always been, or is it about allowing yourself to change and evolve? I think I've been holding onto an outdated version of myself because it feels safer than admitting I've grown beyond certain beliefs and patterns.\n\nAuthenticity might be more about being honest about where you are right now, even if it contradicts who you were yesterday.",
    lastModified: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(7)}`,
    date: getDateDaysAgo(7),
    content: "Family dinner tonight brought up old dynamics I thought I'd outgrown. It's interesting how quickly we fall back into childhood roles when we're around family. My sister made a comment about my career choices that normally wouldn't bother me, but in that context, it stung.\n\nI value independence and self-determination, but I realize I still seek validation from my family. There's a tension there I need to explore more.",
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },

  // Last two weeks
  {
    id: `entry-${getDateDaysAgo(10)}`,
    date: getDateDaysAgo(10),
    content: "Meditation practice is getting easier. Ten minutes this morning without constantly checking the timer. There's a quality of awareness that emerges when you stop trying to control your thoughts and just observe them. It's like watching clouds pass across the sky.\n\nI'm beginning to understand that mindfulness isn't about emptying the mind - it's about changing your relationship with your thoughts. They're just mental events, not facts or commands.",
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(12)}`,
    date: getDateDaysAgo(12),
    content: "Had a difficult conversation with my partner about future plans. We're not aligned on where we want to be in five years - geographically or otherwise. It made me realize how much I value flexibility and spontaneity, while they value stability and long-term planning.\n\nNeither approach is wrong, but finding a middle ground feels challenging. Maybe the answer isn't compromise but creative solutions that honor both perspectives.",
    lastModified: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(14)}`,
    date: getDateDaysAgo(14),
    content: "Watched a documentary about minimalism. The idea of owning less to live more resonates deeply. I look around my apartment and see so many things I've kept 'just in case' or because they represent who I used to be. There's something liberating about the thought of letting go.\n\nMaterial simplicity as a path to mental clarity - that's a principle I want to explore more intentionally.",
    lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },

  // Three weeks ago
  {
    id: `entry-${getDateDaysAgo(18)}`,
    date: getDateDaysAgo(18),
    content: "Volunteered at the food bank today. There's something grounding about direct service - no abstractions, just people helping people. Met a woman who lost her job recently and she said something that stuck with me: 'Dignity isn't about never needing help, it's about how we treat each other when help is needed.'\n\nI believe in the fundamental interconnectedness of human experience. We're all just walking each other home.",
    lastModified: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(20)}`,
    date: getDateDaysAgo(20),
    content: "Creative block has been brutal this week. Every idea feels derivative or forced. Reading 'The War of Art' and Pressfield's concept of Resistance is helping me reframe this. Maybe the block isn't a lack of creativity but fear of creating something imperfect.\n\nPerfectionism is just fear wearing a clever disguise. The aim should be progress, not perfection.",
    lastModified: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(21)}`,
    date: getDateDaysAgo(21),
    content: "Birthday reflection: 32 years old today. Not where I thought I'd be at this age, but maybe that's the point. The life I planned at 22 was based on such limited understanding of what matters. Success looked like titles and salary figures back then.\n\nNow I value peace of mind, meaningful work, and deep relationships. The metrics have completely changed. Growth isn't always upward - sometimes it's inward.",
    lastModified: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },

  // One month ago
  {
    id: `entry-${getDateDaysAgo(28)}`,
    date: getDateDaysAgo(28),
    content: "Attended a philosophy meetup discussing virtue ethics. The idea that character traits can be cultivated through practice is empowering. Courage isn't the absence of fear but acting despite it. Wisdom isn't knowing everything but recognizing the limits of your knowledge.\n\nI want to be more intentional about which virtues I'm cultivating. Curiosity, compassion, and integrity feel like the foundation I want to build on.",
    lastModified: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(30)}`,
    date: getDateDaysAgo(30),
    content: "Conflict at work today illuminated something about my values. When the team decided to take a shortcut that compromised quality for speed, I felt physically uncomfortable. It's not about being right or wrong - it's about alignment with principles.\n\nIntegrity means wholeness - when your actions align with your values. The discomfort I felt was the sensation of being pulled away from wholeness.",
    lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },

  // Six weeks ago
  {
    id: `entry-${getDateDaysAgo(42)}`,
    date: getDateDaysAgo(42),
    content: "Grandmother's funeral today. She lived to 94, sharp until the end. Her last words to me were 'Don't wait to be happy.' Such simple wisdom that cuts through all the complexity we create.\n\nHappiness as a choice rather than a destination. Joy as a practice rather than a reward. These feel like truths worth building a life around.",
    lastModified: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(45)}`,
    date: getDateDaysAgo(45),
    content: "Started learning pottery. There's something profound about working with clay - it requires just the right amount of pressure. Too much and it collapses, too little and it won't take shape. It's a physical metaphor for so many things in life.\n\nBalance, patience, and accepting imperfection. The Japanese concept of wabi-sabi - finding beauty in imperfection and impermanence. That resonates deeply.",
    lastModified: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },

  // Two months ago
  {
    id: `entry-${getDateDaysAgo(56)}`,
    date: getDateDaysAgo(56),
    content: "Therapy session today unpacked my relationship with achievement. Dr. Chen asked, 'What would you be if you never achieved anything else?' The question terrified me, which is probably why it needed to be asked.\n\nI believe I am valuable beyond my productivity, but I don't always act like it. There's work to be done in actually embodying that belief.",
    lastModified: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(60)}`,
    date: getDateDaysAgo(60),
    content: "Book club discussed 'Man's Search for Meaning' tonight. Frankl's idea that we can't always choose our circumstances but can choose our response resonates deeply. The last of human freedoms - the ability to choose one's attitude.\n\nMeaning-making as an active process, not a passive discovery. We create meaning through our choices, our responses, our interpretations. That's both terrifying and liberating.",
    lastModified: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: `entry-${getDateDaysAgo(65)}`,
    date: getDateDaysAgo(65),
    content: "Morning run clarified something about commitment. I've been treating commitments as restrictions, but what if they're actually architecture for freedom? By committing to this daily run, I free myself from daily decision fatigue about whether to exercise.\n\nConstraints can be liberating when chosen consciously. Structure can enable flow rather than prevent it. This reframes so many areas of my life.",
    lastModified: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    isSample: true
  }
]