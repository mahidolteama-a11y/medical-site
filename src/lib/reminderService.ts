import { getDueMedicationRemindersForUser, sendMessageToDatabase, getPatientProfileByUserId } from './dummyDatabase'

let timer: any = null
let lastSent: Record<string, string> = {}

export const initMedicationReminders = (userId?: string) => {
  try { lastSent = JSON.parse(localStorage.getItem('med:lastSent') || '{}') } catch { lastSent = {} }
  if (timer) { clearInterval(timer); timer = null }
  if (!userId) return
  const tick = async () => {
    try {
      const { data: due } = await getDueMedicationRemindersForUser(userId)
      if (!due || due.length === 0) return
      const { data: patient } = await getPatientProfileByUserId(userId)
      for (const item of due) {
        const key = `${item.medication.id}@${item.scheduledAt}`
        if (lastSent[key]) continue
        const subject = 'Medication Reminder'
        const content = `Time to take your medication.\n\nMedication: ${item.medication.name}${item.medication.dosage ? `\nDosage: ${item.medication.dosage}` : ''}\nScheduled time: ${new Date(item.scheduledAt).toLocaleTimeString()}\nPatient: ${patient?.name || ''}`
        await sendMessageToDatabase({ sender_id: userId, recipient_id: userId, subject, content } as any)
        lastSent[key] = new Date().toISOString()
      }
      localStorage.setItem('med:lastSent', JSON.stringify(lastSent))
    } catch {}
  }
  timer = setInterval(tick, 60 * 1000)
  tick()
}

export const stopMedicationReminders = () => { if (timer) clearInterval(timer); timer = null }

