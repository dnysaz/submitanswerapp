import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 50,
    paddingVertical: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  meta: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: 4,
  },
  imagePlaceholder: {
    width: '100%',
    height: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  answerSection: {
    marginTop: 4,
  },
  answerLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#374151',
  },
})

interface PdfData {
  nama: string
  studentId: string
  className: string
  jawaban: string
  imageBase64?: string
  tanggal: string
}

export async function generatePdf(data: PdfData): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Student Answer Sheet</Text>
          <Text style={styles.meta}>Name       : {data.nama}</Text>
          <Text style={styles.meta}>Student ID : {data.studentId}</Text>
          <Text style={styles.meta}>Class      : {data.className}</Text>
          <Text style={styles.meta}>Date       : {data.tanggal}</Text>
        </View>

        <View style={styles.imageSection}>
          {data.imageBase64 ? (
            <Image src={data.imageBase64} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image attached</Text>
            </View>
          )}
        </View>

        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Answer:</Text>
          <Text style={styles.answerText}>{data.jawaban}</Text>
        </View>
      </Page>
    </Document>
  )

  return await renderToBuffer(doc) as Buffer
}
