import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import TextArea from '../../components/ui/TextArea'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Episode, Celebrity } from '../../lib/supabase'

export default function Episodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [formData, setFormData] = useState({
    celebrity_id: '',
    title: '',
    date: '',
    notes: ''
  })
  
  useEffect(() => {
    fetchData()
  }, [])
  
  async function fetchData() {
    try {
      const [episodesData, celebritiesData] = await Promise.all([
        db.episodes.getAll(),
        db.celebrities.getAll()
      ])
      setEpisodes(episodesData)
      setCelebrities(celebritiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingEpisode) {
        await db.episodes.update(editingEpisode.id, formData)
      } else {
        await db.episodes.create(formData)
      }
      
      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving episode:', error)
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('このエピソードを削除してもよろしいですか？')) return
    
    try {
      await db.episodes.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting episode:', error)
    }
  }
  
  function resetForm() {
    setShowForm(false)
    setEditingEpisode(null)
    setFormData({
      celebrity_id: '',
      title: '',
      date: '',
      notes: ''
    })
  }
  
  function startEdit(episode: Episode) {
    setEditingEpisode(episode)
    setFormData({
      celebrity_id: episode.celebrity_id,
      title: episode.title,
      date: episode.date,
      notes: episode.notes
    })
    setShowForm(true)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Episodes</h2>
          <p className="text-gray-600 mt-2">Manage celebrity episodes and content</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Episode
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Celebrity"
                  value={formData.celebrity_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, celebrity_id: e.target.value }))}
                  options={[
                    { value: '', label: 'Select a celebrity' },
                    ...celebrities.map(c => ({ value: c.id, label: c.name }))
                  ]}
                  required
                />
                
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              
              <TextArea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                helpText="Additional information about the episode"
              />
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingEpisode ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {episodes.map((episode) => (
          <Card key={episode.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{episode.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {episode.celebrity?.name} • {new Date(episode.date).toLocaleDateString()}
                  </p>
                  {episode.notes && (
                    <p className="text-gray-600 mt-2 line-clamp-2">{episode.notes}</p>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Link to={`/admin/episodes/${episode.id}`}>
                    <Button variant="outline" size="sm" icon={LinkIcon} className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                      紐付け管理
                    </Button>
                  </Link>
                  <Link to={`/episodes/${episode.id}`}>
                    <Button variant="outline" size="sm" icon={Eye}>
                      View
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Edit}
                    onClick={() => startEdit(episode)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    icon={Trash2}
                    onClick={() => handleDelete(episode.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {episodes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">エピソードが見つかりません。最初のエピソードを作成して開始してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}