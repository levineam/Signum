// Quick test of note creation functionality
const { createNote, getNotes } = require('./src/lib/notes.ts')

// Mock localStorage for Node.js testing
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null
  },
  setItem: function(key, value) {
    this.store[key] = value
  },
  clear: function() {
    this.store = {}
  }
}

// Mock window object
global.window = {}

try {
  // Test note creation
  const newNote = createNote({
    title: "Test Note from Highlighted Text",
    content: "This is a test note created from selected journal text."
  })

  console.log('✅ Note created successfully:', {
    id: newNote.id,
    title: newNote.title,
    content: newNote.content.substring(0, 50) + '...',
    createdAt: newNote.createdAt
  })

  // Test retrieving notes
  const allNotes = getNotes()
  console.log('✅ Retrieved notes count:', allNotes.length)

  console.log('\n🎉 All note functionality tests passed!')

} catch (error) {
  console.error('❌ Test failed:', error.message)
}