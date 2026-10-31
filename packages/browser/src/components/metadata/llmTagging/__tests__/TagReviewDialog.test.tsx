import { fireEvent, render, screen } from '@testing-library/react'

import TagReviewDialog from '../TagReviewDialog'
import { useLlmTagReviewStore } from '../useLlmTagReviewStore'

vi.mock('@/hooks/useTranslate', () => ({
	useTranslate: () => ({
		t: (key: string) => key,
		translate: (key: string) => key,
		locale: 'en-US',
		namespace: 'webApp',
	}),
}))

const acceptSelected = vi.fn()
const rejectCurrent = vi.fn()

const mockActions = {
	acceptSelected,
	rejectCurrent,
	isPending: false,
	hasSelection: true,
	selectedCount: 1,
}

vi.mock('../useLlmTagActions', () => ({
	useLlmTagActions: () => mockActions,
}))

const KEY = 'metadataMatching.llmTagging.reviewDialog'

const makeRecord = (index: number) => ({
	id: `suggestion-${index}`,
	mediaId: `media-${index}`,
	status: 'SUGGESTED',
	suggestedTags: [
		{ name: `tag-${index}-a`, confidence: 0.9, reason: 'because' },
		{ name: `tag-${index}-b`, confidence: 0.5, reason: null },
	],
	media: {
		id: `media-${index}`,
		resolvedName: `Book ${index}`,
		metadata: { title: `Book ${index}` },
	},
})

const records = [makeRecord(1), makeRecord(2), makeRecord(3)] as never[]

const openDialog = (startIndex = 0) => {
	useLlmTagReviewStore.getState().open(records, startIndex)
	render(<TagReviewDialog />)
}

const nextButton = () => screen.getByRole('button', { name: `${KEY}.next` })
const prevButton = () => screen.getByRole('button', { name: `${KEY}.previous` })

const expectPage = (current: number, total: number) => {
	expect(screen.getByText(`${current} / ${total}`)).toBeInTheDocument()
}

describe('TagReviewDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockActions.isPending = false
		useLlmTagReviewStore.setState({
			isOpen: false,
			records: [],
			currentRecordIndex: 0,
			selectedTags: new Set(),
		})
	})

	it('renders the first record when opened', () => {
		openDialog()
		expectPage(1, 3)
		expect(screen.getByText('Book 1')).toBeInTheDocument()
	})

	it('advances to the next record when clicking next', () => {
		openDialog()
		expectPage(1, 3)
		fireEvent.click(nextButton())
		expectPage(2, 3)
		expect(screen.getByText('Book 2')).toBeInTheDocument()
	})

	it('keeps advancing through every record', () => {
		openDialog()
		fireEvent.click(nextButton())
		fireEvent.click(nextButton())
		expectPage(3, 3)
		expect(screen.getByText('Book 3')).toBeInTheDocument()
	})

	it('goes back to the previous record', () => {
		openDialog(2)
		expectPage(3, 3)
		fireEvent.click(prevButton())
		expectPage(2, 3)
		expect(screen.getByText('Book 2')).toBeInTheDocument()
	})

	it('disables previous on the first record and next on the last', () => {
		openDialog()
		expect(prevButton()).toBeDisabled()

		fireEvent.click(nextButton())
		fireEvent.click(nextButton())
		expect(nextButton()).toBeDisabled()
		expect(prevButton()).not.toBeDisabled()
	})

	it('closes the dialog when clicking next on the last record', () => {
		openDialog(2)
		fireEvent.click(nextButton())
		expect(useLlmTagReviewStore.getState().isOpen).toBe(false)
	})

	it('disables navigation while an action is pending', () => {
		mockActions.isPending = true
		openDialog()
		expect(nextButton()).toBeDisabled()
		expect(prevButton()).toBeDisabled()
	})
})
