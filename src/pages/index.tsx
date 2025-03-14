import Head from 'next/head'
import RawImageViewer  from '../components/raw_image'

export default function Home() {
    return (
      <>
        <Head>
          <title>ACM at UAB Raw Image Viewer</title>
        </Head>
        <div className='min-h-screen flex items-center justify-center bg-gray-200'>
          <RawImageViewer />
        </div>
      </>
    )
}
