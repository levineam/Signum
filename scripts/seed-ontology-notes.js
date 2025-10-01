/**
 * Browser console script to seed 20 ontology test notes.
 *
 * USAGE:
 * 1. Navigate to http://localhost:3000/notes in your browser
 * 2. Open browser console (F12 or Cmd+Option+J)
 * 3. Copy and paste this entire file
 * 4. Press Enter to run
 * 5. Refresh the page to see the new notes
 */

const NOTES_STORAGE_KEY = 'signum-notes'
const baseTimestamp = Date.now()

const ontologyTestNotes = [
  {
    title: "On Compassion and Helping Others",
    content: "I've been thinking about what it means to truly help someone. It's not about fixing their problems or telling them what to do. Real compassion requires listening deeply, understanding their unique situation, and empowering them to find their own path. This connects to my core belief that every person has inherent wisdom and capability.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Meeting with Sarah about the Climate Project",
    content: "Had a great conversation with Sarah Johnson today about the community climate initiative. She's passionate about renewable energy and wants to organize workshops at the community center on Elm Street. We agreed to partner with the local library and the environmental nonprofit GreenFuture. Next steps: draft proposal by March 15th.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Why I Left Corporate Law",
    content: "Looking back on my decision to leave the law firm, I realize it wasn't just about the long hours. It was about values alignment. The work didn't connect to my deeper purpose of creating positive social impact. I was optimizing for prestige and income rather than meaning. This was a pivotal moment in understanding that success means living in integrity with my values.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Reading Notes: 'Man's Search for Meaning' by Viktor Frankl",
    content: "Frankl's core insight resonates deeply: we can't always control our circumstances, but we can always choose our attitude and response. He writes about finding meaning even in suffering through three paths: creating work, experiencing love, and choosing our attitude toward unavoidable suffering. This connects to my belief in personal agency and the importance of meaning over mere happiness.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Tension Between Ambition and Presence",
    content: "I'm noticing a recurring pattern: I set ambitious goals, work intensely toward them, but miss the present moment. My daughter asked me to play yesterday and I said 'later' three times because I was finishing a proposal. This isn't who I want to be. How do I honor both my drive to create impact AND my commitment to being present with loved ones?",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Sunday Morning Meditation Insight",
    content: "During meditation today, I had a clear realization: I've been treating my mind like an enemy to be controlled rather than a companion to be understood. The anxious thoughts aren't problems to fix—they're signals carrying information. When I approach them with curiosity instead of judgment, they soften and reveal their underlying concerns.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Coffee with Marcus - Entrepreneurship Discussion",
    content: "Marcus Chen and I spent two hours at Bluebird Café discussing his plans to launch a sustainable fashion startup. He's been researching ethical supply chains and carbon-neutral shipping. His vision is to prove that profitable business and environmental responsibility aren't mutually exclusive. I connected him with my contact at the Impact Investors Network.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "What Makes a Good Conversation?",
    content: "Reflecting on why some conversations feel energizing while others drain me. The good ones share these qualities: both people are genuinely curious, there's space for silence and reflection, ideas build on each other rather than competing, and vulnerability is met with care not judgment. These are the conversations that lead to insight and connection.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Fear of Being Average",
    content: "Had a moment of honest self-reflection: underneath my ambition is a fear of being ordinary, forgettable, unremarkable. This fear drives me to achieve but also makes it hard to rest or feel satisfied. Where did this come from? How much of my striving is toward something I genuinely want versus away from this fear of insignificance?",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Learning to Code at 35",
    content: "Started the Python course on Codecademy. It's humbling to be a beginner again. I'm noticing my self-critic is loud: 'You should already know this' or 'You're too old to learn programming.' But there's also excitement—each small breakthrough (like finally understanding loops today!) feels meaningful. Maybe the discomfort of learning is the whole point.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Mom's Health Diagnosis",
    content: "Mom called with news about her Parkinson's diagnosis. I felt fear, sadness, and also guilt that my first thought was 'how will this affect my schedule?' I want to be there for her, really there—not just managing logistics but offering emotional support. This is testing my capacity to be with difficult feelings without trying to fix everything.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Community Garden Proposal",
    content: "Working on a proposal to convert the vacant lot on 5th and Oak into a community garden. Research shows community gardens reduce crime by 20%, increase property values, provide fresh food access, and build social connections. Need to present to the City Council next month. Key allies: Councilwoman Rodriguez, the Neighborhood Association, and Urban Harvest nonprofit.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "What I Learned from Failure",
    content: "My startup failed after 18 months. We ran out of funding and couldn't find product-market fit. Looking back, I see the lessons: I didn't validate the problem deeply enough, I built features customers said they wanted but didn't actually use, and I avoided difficult conversations with my co-founder about our diverging visions. Failure taught me more than any success ever has.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "The Role of Community in Wellbeing",
    content: "I'm realizing that my mental health struggles correlate directly with isolation. When I'm connected to community—whether it's the Tuesday book club, the running group, or just regular dinners with friends—I feel more resilient, more myself. Humans weren't meant to figure everything out alone. We need each other, not just for practical support but for meaning.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Conversation with Dr. Patel about AI Ethics",
    content: "Dr. Priya Patel gave a fascinating talk at the university about AI ethics. Her main point: technology isn't neutral—it embodies the values and biases of its creators. We discussed the risks of AI systems optimizing for engagement over wellbeing, and how we need interdisciplinary teams (philosophers, social scientists, not just engineers) building these systems. She recommended the book 'Weapons of Math Destruction.'",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Why I Journal",
    content: "People ask why I spend time journaling when I could be 'doing' something. But this IS doing something essential: making sense of experience, noticing patterns, clarifying values, processing emotions. Without reflection, I just accumulate experiences without integrating them. Journaling is how I learn from my life rather than just living it on autopilot.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Weekend at the Lake House",
    content: "Spent the weekend at Lake Tahoe with the extended family. No wifi, no agenda, just being together. We played cards, took long walks, cooked meals together. My nephew taught me how to skip stones. These simple moments of connection—this is what I'll remember at the end of my life, not the promotions or achievements.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Justice, Charity, and Systemic Change",
    content: "Been thinking about the difference between charity and justice. Charity is giving to those in need; justice is changing the systems that create need. Both matter, but I've focused too much on charity (volunteering at the food bank) without addressing root causes (advocating for living wages, affordable housing policy). Real compassion requires both individual acts and systemic work.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Identity Beyond Work",
    content: "When I meet someone new, my first question is always 'What do you do?' But I'm realizing how much I've conflated identity with occupation. When I was laid off last year, I felt like I'd lost myself. Who am I if not my job title? This crisis forced me to find more stable ground: I'm someone who values creativity, learning, connection. Those don't disappear when employment changes.",
    type: 'regular',
    isPinned: false
  },
  {
    title: "Teaching My Daughter About Emotions",
    content: "Emma, age 7, melted down because her art project 'wasn't perfect.' I saw my own perfectionism reflected back. Instead of saying 'it's fine,' I tried something different: 'It's hard when something doesn't turn out how you imagined. All feelings are okay. What matters is what we do with them.' We talked about how even adult artists make lots of 'bad' art on the way to good art. She seemed to relax.",
    type: 'regular',
    isPinned: false
  }
]

function seedOntologyNotes() {
  try {
    // Get existing notes
    const existingNotes = localStorage.getItem(NOTES_STORAGE_KEY)
    const notes = existingNotes ? JSON.parse(existingNotes) : []

    // Generate the new test notes
    const newNotes = ontologyTestNotes.map((noteData, index) => ({
      ...noteData,
      id: `ontology-test-${baseTimestamp + index}`,
      createdAt: new Date(baseTimestamp + (index * 60000)).toISOString(), // 1 minute apart
      updatedAt: new Date(baseTimestamp + (index * 60000)).toISOString()
    }))

    // Combine and save
    const allNotes = [...notes, ...newNotes]
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes))

    console.log(`✅ Successfully added ${newNotes.length} ontology test notes!`)
    console.log('📝 Total notes in system:', allNotes.length)
    console.log('🔄 Refresh the page to see the new notes.')

    return newNotes
  } catch (error) {
    console.error('❌ Error seeding notes:', error)
    return null
  }
}

// Run the seed function
console.log('🌱 Seeding ontology test notes...')
seedOntologyNotes()