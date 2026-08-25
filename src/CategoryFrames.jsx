import Frame from './Frame'

export default function CategoryFrames({ categories }) {
  return (
    <>
      {categories.map((cat) => (
        <Frame key={cat.id} data={cat} />
      ))}
    </>
  )
}
