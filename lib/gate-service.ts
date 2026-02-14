export async function getGateDetails(id: string) {
  // In a real app, this would be: fetch(`https://api.yoursite.com/gates/${id}`)
  const gates = [
    { id: "4", name: "North Gate 4", entries: "14,282", flow: 42, wait: "3 MINS" },
    { id: "1", name: "Main Entrance", entries: "5,120", flow: 15, wait: "1 MIN" },
  ];
  
  return gates.find(g => g.id === id);
}