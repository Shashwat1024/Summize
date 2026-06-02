import { useState, useEffect, useRef } from 'react';
import { copy, linkIcon, tick } from '../assets';
import { useLazyGetSummaryQuery } from '../services/article';

const Demo = () => {
    const [article, setArticle] = useState({ url: '', summary: '' });
    const [allArticles, setAllArticles] = useState([]);
    const [copied, setCopied] = useState("");
    const [summaryLength, setSummaryLength] = useState(3);
    const copyTimerRef = useRef(null);

    const [getSummary, { error, isFetching }] = useLazyGetSummaryQuery();

    useEffect(() => {
        try {
            const articlesFromLocalStorage = JSON.parse(localStorage.getItem('articles'));
            if (articlesFromLocalStorage) setAllArticles(articlesFromLocalStorage);
        } catch {
            // corrupted storage — start fresh
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data } = await getSummary({ articleUrl: article.url, length: summaryLength });
        if (data?.summary) {
            const newArticle = { ...article, summary: data.summary };
            const updatedAllArticles = [newArticle, ...allArticles];
            setArticle(newArticle);
            setAllArticles(updatedAllArticles);
            try {
                localStorage.setItem('articles', JSON.stringify(updatedAllArticles));
            } catch {
                // storage quota exceeded — continue without persisting
            }
        }
    };

    const handleCopy = (e, copyUrl) => {
        e.stopPropagation();
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        setCopied(copyUrl);
        navigator.clipboard.writeText(copyUrl);
        copyTimerRef.current = setTimeout(() => setCopied(""), 3000);
    };

    const handleClearHistory = () => {
        setAllArticles([]);
        localStorage.removeItem('articles');
    };

    return (
        <section className='mt-16 w-full max-w-xl'>
            {/* Search */}
            <div className='flex flex-col w-full gap-2'>
                <form
                    className='relative flex justify-center items-center'
                    onSubmit={handleSubmit}
                >
                    <img
                        src={linkIcon}
                        alt='link_icon'
                        className='absolute left-0 my-2 ml-3 w-5'
                    />
                    <input
                        type="url"
                        placeholder='Enter a URL'
                        value={article.url}
                        onChange={(e) => setArticle({ ...article, url: e.target.value })}
                        required
                        className='url_input peer'
                    />
                    <button
                        type='submit'
                        className='submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700'
                    >
                        ↵
                    </button>
                </form>

                {/* Summary length control */}
                <div className='flex items-center gap-3 px-1 mt-1'>
                    <label className='font-satoshi text-sm text-gray-600 whitespace-nowrap'>
                        Summary length:
                    </label>
                    <input
                        type='range'
                        min={1}
                        max={5}
                        value={summaryLength}
                        onChange={(e) => setSummaryLength(Number(e.target.value))}
                        className='flex-1 accent-blue-600'
                    />
                    <span className='font-satoshi text-sm font-medium text-gray-700 w-20 text-right'>
                        {summaryLength} {summaryLength === 1 ? 'sentence' : 'sentences'}
                    </span>
                </div>

                {/* Browser url history */}
                {allArticles.length > 0 && (
                    <div className='flex justify-between items-center px-1 mt-1'>
                        <p className='font-satoshi text-xs text-gray-500'>Recent searches</p>
                        <button
                            type='button'
                            onClick={handleClearHistory}
                            className='font-satoshi text-xs text-red-500 hover:text-red-700 transition-colors'
                        >
                            Clear history
                        </button>
                    </div>
                )}
                <div className='flex flex-col gap-1 max-h-60 overflow-y-auto'>
                    {allArticles.map((item, index) => (
                        <div
                            key={`link-${index}`}
                            onClick={() => setArticle(item)}
                            className='link_card'
                        >
                            <div
                                className='copy_btn'
                                onClick={(e) => handleCopy(e, item.url)}
                            >
                                <img
                                    src={copied === item.url ? tick : copy}
                                    alt='copy_icon'
                                    className='w-[40%] h-[40%] object-contain'
                                />
                            </div>
                            <p className='flex-1 font-satoshi text-blue-700 font-medium text-sm truncate'>
                                {item.url}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Display results */}
            <div className='my-10 max-w-full flex justify-center items-center'>
                {isFetching ? (
                    <div className='flex flex-col gap-3 w-full'>
                        <h2 className='font-satoshi font-bold text-gray-600 text-xl'>
                            Article <span className='blue_gradient'>Summary</span>
                        </h2>
                        <div className='summary_box animate-pulse'>
                            <div className='h-3 bg-gray-200 rounded w-full mb-2.5' />
                            <div className='h-3 bg-gray-200 rounded w-5/6 mb-2.5' />
                            <div className='h-3 bg-gray-200 rounded w-4/6 mb-2.5' />
                            <div className='h-3 bg-gray-200 rounded w-full mb-2.5' />
                            <div className='h-3 bg-gray-200 rounded w-3/4' />
                        </div>
                    </div>
                ) : error ? (
                    <p className='font-inter font-bold text-black text-center'>
                        Well, that wasn't supposed to happen...
                        <br />
                        <span className='font-satoshi font-normal text-gray-700'>
                            {error?.data?.error}
                        </span>
                    </p>
                ) : (
                    article.summary && (
                        <div className='flex flex-col gap-3'>
                            <h2 className='font-satoshi font-bold text-gray-600 text-xl'>
                                Article <span className='blue_gradient'>Summary</span>
                            </h2>
                            <div className='summary_box'>
                                <p className='font-inter font-medium text-sm text-gray-700'>
                                    {article.summary}
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    );
};

export default Demo;
